import { Link } from "react-router-dom";

function RouteSearching() {
  return (
    <div className="min-h-screen bg-gray-100">

      <header className="h-16 bg-white border-b flex items-center px-6">
        <Link
          to="/dashboard"
          className="font-semibold text-gray-900"
        >
          ← CloudCRM
        </Link>
      </header>

      <main className="p-8">

        <h1 className="text-3xl font-bold">
          Route Searching
        </h1>

        <p className="text-gray-500 mt-1">
          Search and compare available routes.
        </p>


        <div className="bg-white rounded-xl border p-6 mt-8">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <input
              type="text"
              placeholder="Country"
              className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />

            <input
              type="text"
              placeholder="Prefix"
              className="border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-black"
            />

            <button className="bg-black text-white rounded-lg px-4 py-3">
              Search Routes
            </button>

          </div>

        </div>

      </main>

    </div>
  );
}

export default RouteSearching;