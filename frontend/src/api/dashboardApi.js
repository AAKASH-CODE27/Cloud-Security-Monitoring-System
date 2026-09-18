import API from "./axios";

export const getDashboardSummary = () => API.get("/dashboard");
export const getDashboardCharts = (days = 30) => API.get("/dashboard/charts", { params: { days } });
