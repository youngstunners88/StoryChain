import { useState, useEffect } from "react";

interface Project {
  id: string;
  name: string;
  client: string;
  service: string;
  price: number;
  status: "completed" | "in_progress" | "pending";
  completedAt?: string;
  rating?: number;
  testimonial?: string;
}

export default function RevenueDashboard() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "Waters Of Life Website",
      client: "Chef Ntokozo",
      service: "Business Website",
      price: 250,
      status: "completed",
      completedAt: "2026-02-19",
      rating: 5,
      testimonial: "Exceptional work! Fast and professional."
    },
    {
      id: "2",
      name: "Portfolio Site",
      client: "Artist",
      service: "Simple Website",
      price: 75,
      status: "completed",
      completedAt: "2026-02-18",
      rating: 5
    },
    {
      id: "3",
      name: "Booking Automation",
      client: "Consultant",
      service: "Automation",
      price: 150,
      status: "in_progress"
    }
  ]);

  const totalRevenue = projects
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.price, 0);
    
  const avgRating = projects
    .filter(p => p.rating)
    .reduce((sum, p) => sum + (p.rating || 0), 0) / 
    projects.filter(p => p.rating).length || 0;

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Revenue Dashboard</h1>
          <p className="text-zinc-400">Track earnings and project performance</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-emerald-400">${totalRevenue}</div>
            <div className="text-sm text-zinc-400">Total Revenue</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-400">{projects.length}</div>
            <div className="text-sm text-zinc-400">Total Projects</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-amber-400">{avgRating.toFixed(1)}</div>
            <div className="text-sm text-zinc-400">Avg Rating</div>
          </div>
          <div className="bg-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-400">
              ${projects.filter(p => p.status === "completed").length > 0 
                ? Math.round(totalRevenue / projects.filter(p => p.status === "completed").length)
                : 0}
            </div>
            <div className="text-sm text-zinc-400">Avg Project Value</div>
          </div>
        </div>

        {/* Projects Table */}
        <div className="bg-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-700">
              <tr>
                <th className="text-left p-3">Project</th>
                <th className="text-left p-3">Client</th>
                <th className="text-left p-3">Service</th>
                <th className="text-right p-3">Price</th>
                <th className="text-center p-3">Status</th>
                <th className="text-center p-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="border-t border-zinc-700">
                  <td className="p-3">{project.name}</td>
                  <td className="p-3 text-zinc-400">{project.client}</td>
                  <td className="p-3 text-zinc-400">{project.service}</td>
                  <td className="p-3 text-right font-mono text-emerald-400">${project.price}</td>
                  <td className="p-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded text-xs ${
                      project.status === "completed" ? "bg-emerald-900 text-emerald-300" :
                      project.status === "in_progress" ? "bg-blue-900 text-blue-300" :
                      "bg-zinc-700 text-zinc-300"
                    }`}>
                      {project.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {project.rating ? "⭐".repeat(project.rating) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <button className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg transition-colors">
            Add Project
          </button>
          <button className="bg-zinc-700 hover:bg-zinc-600 px-4 py-2 rounded-lg transition-colors">
            Export Report
          </button>
        </div>
      </div>
    </div>
  );
}
