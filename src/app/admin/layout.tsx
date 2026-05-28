export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-neo-dark p-4">
      {children}
    </div>
  )
}