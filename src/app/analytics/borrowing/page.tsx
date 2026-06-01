import { redirect } from 'next/navigation';

// Borrowing analytics is now a tab inside /analytics
export default function BorrowingRedirectPage() {
  redirect('/analytics');
}
