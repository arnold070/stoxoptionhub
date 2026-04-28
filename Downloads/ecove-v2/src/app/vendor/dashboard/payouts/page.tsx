// Redirect to earnings page which contains payout functionality
import { redirect } from 'next/navigation'
export default function PayoutsRedirect() {
  redirect('/vendor/dashboard/earnings')
}
