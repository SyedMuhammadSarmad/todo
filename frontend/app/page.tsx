export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Todo App</h1>
        <p className="text-lg text-gray-600 mb-8">
          Welcome to your multi-user todo application
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/signup"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Sign Up
          </a>
          <a
            href="/signin"
            className="px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50"
          >
            Sign In
          </a>
        </div>
      </div>
    </main>
  );
}
