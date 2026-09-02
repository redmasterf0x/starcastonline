import { ProfileView } from "@/components/profile/profile-view"

// Legacy/id-based profile URL. `/u/<username>` is the shareable form.
export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProfileView userId={id} />
}
