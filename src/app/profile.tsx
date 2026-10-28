import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-fb-bg dark:bg-fb-darkBg px-4 pt-6">
      <View className="bg-white dark:bg-fb-darkCard rounded-2xl p-5 border border-fb-border dark:border-fb-darkBorder items-center">
        <View className="w-16 h-16 rounded-full bg-brand-100 items-center justify-center mb-3">
          <Text className="text-brand-700 text-2xl font-bold">P</Text>
        </View>
        <Text className="text-xl font-bold text-fb-text dark:text-fb-darkText mb-1">
          ইউজার প্রোফাইল
        </Text>
        <Text className="text-fb-secondary dark:text-fb-darkSecondary text-sm text-center">
          ফেজ ২ ও ৩-এ এখানে লগইন স্টেট এবং ইউজারের প্রোফাইল তথ্য যুক্ত করা হবে।
        </Text>
      </View>
    </SafeAreaView>
  );
}
