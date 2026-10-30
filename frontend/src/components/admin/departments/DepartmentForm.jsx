import { useEffect, useState } from "react";

const initialForm = {
    name: "",
    description: "",
}

function DepartmentForm({
  department = null,
  onSubmit,
  onCancel,
  loading = false,
}) {

  const [formData , setFormData] = useState(initialForm);

  useEffect(()=>{
    setFormData({
      name: department?.name ?? "",
      description: department?.description ?? "",
    })
  },[department])

  const handleChange = (event) =>{
    const {name , value} = event.target;

    setFormData((prev)=>({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    if(!formData.name.trim()) return;

    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
    })
  }





  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="department-name" className="mb-1 block text-sm font-medium">
          Department Name
        </label>

        <input id="department-name" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Engineering" className="w-full rounded-lg border px-3 py-2" />
      </div>


      <div>
        <label htmlFor="department-description" className="mb-1 block text-sm font-medium">
          Description
        </label>

        <textarea id="department-description" name="description" value={formData.description} onChange={handleChange} rows={3} placeholder="Department responsibilities" className="w-full rounded-lg border px-3 py-2"></textarea>
      </div>

    <div className="flex gap-3">
      <button type="submit" disabled={loading} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-50"> 
           {loading
            ? "Saving..."
            : department
              ? "Update Department"
              : "Create Department"}
              </button>
   

    {onCancel && (
      <button 
      type="button" onClick={onCancel} className="rounded-lg border px-4 py-2"> 
      Cancel
      </button>
    )}

     </div>


    </form>
  )
}

export default DepartmentForm;