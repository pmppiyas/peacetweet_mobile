import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreatePostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-fb-bg dark:bg-fb-darkBg px-4 pt-6">
      <View className="bg-white dark:bg-fb-darkCard rounded-2xl p-5 border border-fb-border dark:border-fb-darkBorder">
        <Text className="text-xl font-bold text-fb-text dark:text-fb-darkText mb-2">
          নতুন দোয়া বা রিমাইন্ডার শেয়ার করুন
        </Text>
        <Text className="text-fb-secondary dark:text-fb-darkSecondary text-sm">
          ফেজ ৩-এ এখানে ব্যাকএন্ড এপিআই কানেক্ট করে নতুন পোস্ট সাবমিট করার ফর্ম যুক্ত করা হবে।
        </Text>
      </View>
    </SafeAreaView>
  );
}
