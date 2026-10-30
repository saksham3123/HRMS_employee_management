const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "")

const getAuthHeaders =  () => {
    const token = localStorage.getItem("token")

    return {
        "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }
    
}


const handleResponse = async (response) =>{
    const data = await response.json().catch(()=>({}))

    if(!response.ok){
         throw new Error(
      data.message || `Request failed with status ${response.status}`
    );

    }

    return data
}

const departmentService = 
{
    getAll:async () => {
        const response = await fetch(`$(API_URL)/api/departments` , {
            method: "GET",
            headers: getAuthHeaders(),
            
        })

        return handleResponse(response)
        
    },


    create: async (departmentData) => {
        const response = await fetch(`${API_URL}/api/departments`, {
            method : "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(departmentData),
        })
        
        return handleResponse(response)
    },


    update: async (id , departmentData) => {
        const response = await fetch(`${API_URL}/api/departments/${id}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body:JSON.stringify(departmentData)
        })

        return handleResponse(response)
    },


    delete: async (id)=>{
        const response = await fetch(`${API_URL}/api/departments/${id}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
        })

        return handleResponse(response)
    }
}

export default departmentService;