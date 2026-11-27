import React, { useId, useLayoutEffect, useSyncExternalStore } from 'react';
import { StyleSheet, View } from 'react-native';

type Listener = () => void;

const entries = new Map<string, React.ReactNode>();
const listeners = new Set<Listener>();
let snapshot: Array<[string, React.ReactNode]> = [];

function emit() {
  snapshot = Array.from(entries.entries());
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return snapshot;
}

/**
 * Renders portaled overlays directly inside the main Activity window (AppShell)
 * so bottom sheets share MainActivity's soft-keyboard session without Android <Modal> Dialog focus loss.
 */
export function RootOverlayPortalHost() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (items.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { zIndex: 2000 }]}>
      {items.map(([id, node]) => (
        <View
          key={id}
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}>
          {node}
        </View>
      ))}
    </View>
  );
}

/**
 * Synchronous commit-phase portal into RootOverlayPortalHost.
 */
export function RootOverlayPortal({ children }: { children: React.ReactNode }) {
  const id = useId();

  useLayoutEffect(() => {
    entries.set(id, children);
    emit();
  }, [id, children]);

  useLayoutEffect(() => {
    return () => {
      entries.delete(id);
      emit();
    };
  }, [id]);

  return null;
}
