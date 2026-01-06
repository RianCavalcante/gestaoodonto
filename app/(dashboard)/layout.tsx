import { Sidebar } from "@/components/layout/sidebar";
import { Suspense } from "react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <Sidebar />
            <main className="flex-1 overflow-y-auto bg-white/50">
                <Suspense fallback={
                    <div className="flex items-center justify-center h-screen">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                        </div>
                    </div>
                }>
                    {children}
                </Suspense>
            </main>
        </div>
    );
}
