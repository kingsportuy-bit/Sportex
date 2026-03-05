import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { cookies } from 'next/headers'
import { AuthProvider } from '@/components/providers'
import { SidebarProvider } from '@/components/providers/SidebarContext'
import { MainContent } from '@/components/layout/MainContent'
import { RightPanel } from '@/components/layout/RightPanel'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const userId = cookieStore.get('sportex_user_id')?.value || null

    return (
        <AuthProvider userId={userId}>
            <SidebarProvider>
                <div className="min-h-screen bg-dark-900">
                    <div className="flex">
                        <Sidebar />
                        <div className="flex-1 flex flex-col">
                            <Header />
                            <main className="flex-1 p-6 md:p-8 lg:p-10 max-w-[1800px] mx-auto w-full">
                                {children}
                            </main>
                        </div>
                    </div>
                    <RightPanel />
                </div>
            </SidebarProvider>
        </AuthProvider>
    )
}