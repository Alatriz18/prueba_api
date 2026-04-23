import frappe
from frappe.model.document import Document

class ProductoExterno(Document):
    def on_update(self):
        tag_name = "Sin Stock"
        
        if self.stock == 0:
            exists = frappe.db.exists("Tag Link", {
                "document_type": self.doctype,
                "document_name": self.name,
                "tag": tag_name
            })
            
            if not exists:
                # Creamos la etiqueta globalmente si no existe
                if not frappe.db.exists("Tag", tag_name):
                    frappe.get_doc({"doctype": "Tag", "name": tag_name}).insert(ignore_permissions=True)
                
                #  Creamos el vínculo 
                frappe.get_doc({
                    "doctype": "Tag Link",
                    "document_type": self.doctype,
                    "document_name": self.name,
                    "tag": tag_name
                }).insert(ignore_permissions=True)
            
            # Actualizamos el campo interno de Frappe para que se vea en la lista
            self.db_set("_user_tags", tag_name, update_modified=False)
            frappe.msgprint("Etiqueta 'Sin Stock' vinculada.")
            
        else:
            # Si hay stock, borramos el vínculo de la etiqueta
            frappe.db.delete("Tag Link", {
                "document_type": self.doctype,
                "document_name": self.name,
                "tag": tag_name
            })
            self.db_set("_user_tags", "", update_modified=False)