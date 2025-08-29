import { apiRequest } from "@/lib/queryClient";

export const GetDemands = async () => {
  try {
    const response = await apiRequest("GET", "/demands/getall");
    const data = await response.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error("Erro ao buscar demandas:", error);
    return error;
  }
};

export const PostDemands = async () => {
  try {
    const response = await apiRequest("GET", "/demands/getall");
    const data = await response.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error("Erro ao buscar demandas:", error);
    return error;
  }
};

export const GetDemandsById = async (id: number) => {
  try {
    if (!id) return () => console.error("Erro ao buscar demandas:");
    const response = await apiRequest("GET", `/demands/${id}`);
    const data = await response.json();
    console.log(data)
    return data;
  } catch (error) {
    console.error("Erro ao buscar demandas:", error);
    return [];
  }
};
