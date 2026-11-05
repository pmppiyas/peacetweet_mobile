export interface FeelingItem {
  id: string;
  label: string;
  labelBn: string;
  emoji: string;
}

export const FEELINGS: FeelingItem[] = [
  { id: 'blessed', label: 'blessed', labelBn: 'ধন্য', emoji: '😇' },
  { id: 'grateful', label: 'grateful', labelBn: 'কৃতজ্ঞ', emoji: '🤲' },
  { id: 'peaceful', label: 'peaceful', labelBn: 'প্রশান্ত', emoji: '🕊️' },
  { id: 'happy', label: 'happy', labelBn: 'আনন্দিত', emoji: '😊' },
  { id: 'thankful', label: 'thankful', labelBn: 'শুকরিয়াশীল', emoji: '💖' },
  { id: 'loved', label: 'loved', labelBn: 'স্নেহসিক্ত', emoji: '🥰' },
  { id: 'hopeful', label: 'hopeful', labelBn: 'আশাবাদী', emoji: '🌟' },
  { id: 'thoughtful', label: 'thoughtful', labelBn: 'চিন্তাশীল', emoji: '🤔' },
  { id: 'relieved', label: 'relieved', labelBn: 'ভারমুক্ত', emoji: '😌' },
  { id: 'motivated', label: 'motivated', labelBn: 'অনুপ্রাণিত', emoji: '💪' },
  { id: 'patient', label: 'patient', labelBn: 'ধৈর্যশীল', emoji: '⏳' },
  { id: 'sad', label: 'sad', labelBn: 'বিষণ্ণ', emoji: '😔' },
];

export const getFeelingById = (id?: string | null): FeelingItem | undefined => {
  if (!id) return undefined;
  return FEELINGS.find((f) => f.id.toLowerCase() === id.toLowerCase());
};
