import frappe
from frappe import _

@frappe.whitelist()
def importar_producto(product_id, title, price, description, category, stock, thumbnail):
    try:
        # Convertimos a entero para asegurar el tipo de dato
        p_id = frappe.utils.cint(product_id)
        
        # Verificamos si ese ID de API ya existe en nuestra base para no duplicar
        if frappe.db.exists("Producto Externo", {"product_id": p_id}):
            return {"status": "duplicado"}

        nuevo_doc = frappe.get_doc({
            "doctype": "Producto Externo",
            "product_id": p_id,        # Se guarda como INT
            "title": title,
            "price": frappe.utils.flt(price),
            "description": description,
            "category": category,
            "stock": frappe.utils.cint(stock),
            "image": thumbnail
        })
        
        nuevo_doc.insert(ignore_permissions=True)
        frappe.db.commit()
        
        return {"status": "ok"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}