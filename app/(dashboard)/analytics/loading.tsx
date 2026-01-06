export default function Loading() {
    return (
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
            <div className="text-center space-y-4">
                <div className="relative w-16 h-16 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Carregando analytics...</p>
            </div>
        </div>
    );
}
