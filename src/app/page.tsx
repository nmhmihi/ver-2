
"use client";

import CurrencyClarityApp from '@/components/CurrencyClarityApp';
import { FirebaseClientProvider } from '@/firebase/client-provider';

/**
 * Trang chính của ứng dụng Currency Clarity.
 * Đảm bảo ứng dụng được bọc trong FirebaseClientProvider để sử dụng các dịch vụ Firebase.
 */
export default function Home() {
  return (
    <FirebaseClientProvider>
      <CurrencyClarityApp />
    </FirebaseClientProvider>
  );
}
