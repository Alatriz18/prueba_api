frappe.pages['productos-externos'].on_page_load = function(wrapper) {
    var page = frappe.ui.make_app_page({
        parent: wrapper,
        title: 'Productos Externos',
        single_column: true
    });

    let $container = $(wrapper).find('.layout-main-section');
    $container.empty().append(`
        <div class="p-3">
            <div class="row mb-3">
                <div class="col-md-4">
                    <div class="input-group">
                        <input type="text" id="api-search" class="form-control" placeholder="Buscar producto...">
                        <div class="input-group-append">
                            <button class="btn btn-primary" id="btn-search">Buscar</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <select id="api-category-filter" class="form-control">
                        <option value="">Todas las Categorías</option>
                    </select>
                </div>
            </div>
            <table class="table table-bordered">
                <thead>
                    <tr>
                        <th>Imagen</th>
                        <th>Producto</th>
                        <th>Categoría</th>
                        <th>Precio</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody id="api-table-body"></tbody>
            </table>
        </div>
    `);

    // 1. Función para cargar categorías en el Dropdown
    const cargar_categorias = () => {
        fetch('https://dummyjson.com/products/categories')
            .then(res => res.json())
            .then(categories => {
                let options = '<option value="">Todas las Categorías</option>';
                categories.forEach(cat => {
                    let slug = cat.slug || cat;
                    let name = cat.name || cat;
                    options += `<option value="${slug}">${name}</option>`;
                });
                $('#api-category-filter').html(options);
            });
    };

    // 2. Función principal de renderizado
    const render_productos = (url = 'https://dummyjson.com/products') => {
        $('#api-table-body').html('<tr><td colspan="5" class="text-center">Cargando...</td></tr>');

        frappe.call({
            method: "frappe.client.get_list",
            args: {
                doctype: "Producto Externo",
                fields: ["product_id"]
            },
            callback: function(r) {
                let existentes = (r.message || []).map(d => String(d.product_id));

                fetch(url).then(res => res.json()).then(data => {
                    let html = '';
                    if (!data.products || data.products.length === 0) {
                        html = '<tr><td colspan="5" class="text-center">No hay resultados</td></tr>';
                    } else {
                        data.products.forEach(p => {
                            let ya_importado = existentes.includes(String(p.id));
                            let boton_html = ya_importado 
                                ? `<button class="btn btn-sm btn-secondary disabled" disabled>Importado</button>`
                                : `<button class="btn btn-sm btn-success btn-import" 
                                    data-id="${p.id}" data-title="${p.title}" data-price="${p.price}" 
                                    data-cat="${p.category}" data-stock="${p.stock}" data-thumb="${p.thumbnail}"
                                    data-desc="${p.description}">Importar</button>`;

                            html += `
                                <tr id="row-${p.id}" style="${ya_importado ? 'background-color: #d4edda;' : ''}">
                                    <td><img src="${p.thumbnail}" width="40"></td>
                                    <td>${p.title}</td>
                                    <td><span class="badge badge-secondary">${p.category}</span></td>
                                    <td>$${p.price}</td>
                                    <td>${boton_html}</td>
                                </tr>`;
                        });
                    }
                    $('#api-table-body').html(html);
                });
            }
        });
    };

    // Filtro por Dropdown (Categoría)
    $(wrapper).on('change', '#api-category-filter', function() {
        let cat = $(this).val();
        let url = cat ? `https://dummyjson.com/products/category/${cat}` : 'https://dummyjson.com/products';
        render_productos(url);
    });

    // Filtro por Búsqueda (Texto)
    $('#btn-search').click(() => {
        let q = $('#api-search').val();
        $('#api-category-filter').val(''); 
        render_productos(q ? `https://dummyjson.com/products/search?q=${q}` : undefined);
    });

    // Lógica de Importar 
    $(wrapper).on('click', '.btn-import', function() {
        let $btn = $(this);
        let d = $btn.data();
        $btn.prop('disabled', true).text('...');

        frappe.call({
            method: "prueba_api.api.importar_producto",
            args: {
                product_id: d.id, title: d.title, price: d.price,
                description: d.desc, category: d.cat, stock: d.stock, thumbnail: d.thumb
            },
            callback: function(r) {
                if (r.message && r.message.status === 'ok') {
                    frappe.show_alert({message: 'Importado', indicator: 'green'});
                    $(`#row-${d.id}`).css('background-color', '#d4edda');
                    $btn.parent().html(`<button class="btn btn-sm btn-secondary disabled" disabled>Importado</button>`);
                }
            }
        });
    });

    // Carga inicial
    cargar_categorias();
    render_productos();
};