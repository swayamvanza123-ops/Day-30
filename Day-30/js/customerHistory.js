(() => {
const $=id=>document.getElementById(id);
let selectedCustomerId=null;
const completed=s=>s.status!=="Cancelled";
function customerSales(d,c){return d.sales.filter(s=>completed(s)&&((c.phone&&s.phone===c.phone)||s.customerId===c.id||(!c.phone&&s.customer===c.name)));}
function customerReturns(d,sales){const ids=new Set(sales.map(s=>s.id));return d.returns.filter(r=>ids.has(r.saleId));}
function paymentStatus(s){const paid=Number(s.paid)||0,due=Number(s.due)||Math.max(0,(Number(s.total)||0)-paid);if(due<=0.009)return "Paid";if(paid>0)return "Partial";return "Pending";}
function customerSummary(d,c){const sales=customerSales(d,c),returns=customerReturns(d,sales);return {sales,returns,total:sales.reduce((n,s)=>n+(Number(s.total)||0),0),paid:sales.reduce((n,s)=>n+(Number(s.paid)||0),0),pending:sales.reduce((n,s)=>n+(Number(s.due)||Math.max(0,(Number(s.total)||0)-(Number(s.paid)||0))),0),returned:returns.reduce((n,r)=>n+(Number(r.quantity)||0),0)};}
function renderDirectory(){const d=DB.read(),q=($("customerSearch").value||"").toLowerCase();const customers=d.customers.filter(c=>(String(c.name||"")+" "+String(c.phone||"")).toLowerCase().includes(q));$("customerCount").textContent=customers.length+" customers";$("customerHistoryTable").innerHTML=customers.map(c=>{const x=customerSummary(d,c);return `<tr><td><b>${DB.escape(c.name)}</b><br><small>${DB.escape(c.id)}</small></td><td>${DB.escape(c.phone||"—")}</td><td>${DB.escape(c.email||"—")}</td><td>${x.sales.length}</td><td>${DB.money(x.total)}</td><td><button class="action-link" data-profile="${DB.escape(c.id)}">View profile →</button></td></tr>`}).join("")||'<tr><td colspan="6" class="empty">No customers found. Complete a sale to add a customer.</td></tr>';}
function renderProfile(){const d=DB.read(),c=d.customers.find(x=>x.id===selectedCustomerId);if(!c){$("profileSection").hidden=true;return;}const x=customerSummary(d,c);$("profileSection").hidden=false;$("profileName").textContent=c.name;$("profileContact").textContent=[c.phone,c.email].filter(Boolean).join(" · ")||"No contact details";$("profileId").textContent=c.id;$("profileOrders").textContent=x.sales.length;$("profilePurchase").textContent=DB.money(x.total);$("profilePaid").textContent=DB.money(x.paid);$("profilePending").textContent=DB.money(x.pending);$("profileReturned").textContent=x.returned;
const from=$("purchaseFrom").value,to=$("purchaseTo").value,status=$("purchaseStatus").value;
const filtered=x.sales.filter(s=>{const day=new Date(s.date).toISOString().slice(0,10);return (!from||day>=from)&&(!to||day<=to)&&(!status||paymentStatus(s)===status);}).sort((a,b)=>new Date(b.date)-new Date(a.date));
$("profileSalesTable").innerHTML=filtered.map(s=>`<tr><td>${DB.escape(s.id)}</td><td>${new Date(s.date).toLocaleDateString()}</td><td>${s.items.map(i=>DB.escape(i.name)+" × "+i.quantity).join(", ")}</td><td>${DB.money(s.total)}</td><td><span class="pill ${paymentStatus(s)==="Pending"?"out":paymentStatus(s)==="Partial"?"low":""}">${paymentStatus(s)}</span></td><td><button class="action-link" data-invoice="${DB.escape(s.id)}">Open / print</button></td></tr>`).join("")||'<tr><td colspan="6" class="empty">No purchases match these filters.</td></tr>';
$("profileReturnsTable").innerHTML=x.returns.slice().sort((a,b)=>new Date(b.date)-new Date(a.date)).map(r=>`<tr><td>${DB.escape(r.id)}</td><td>${DB.escape(r.saleId)}</td><td>${DB.escape(r.productName)}</td><td>${Number(r.quantity)||0}</td><td>${DB.money(r.refund)}</td><td><span class="pill">${DB.escape(r.status||"Processed")}</span></td><td><button class="action-link" data-return="${DB.escape(r.id)}">View details</button></td></tr>`).join("")||'<tr><td colspan="7" class="empty">No returns for this customer.</td></tr>';
}
$("customerSearch").addEventListener("input",renderDirectory);
$("customerHistoryTable").addEventListener("click",e=>{const id=e.target.dataset.profile;if(id){selectedCustomerId=id;renderProfile();$("profileSection").scrollIntoView({behavior:"smooth"});}});
["purchaseFrom","purchaseTo","purchaseStatus"].forEach(id=>$(id).addEventListener("change",renderProfile));
$("clearPurchaseFilters").addEventListener("click",()=>{$("purchaseFrom").value="";$("purchaseTo").value="";$("purchaseStatus").value="";renderProfile();});
$("profileSalesTable").addEventListener("click",e=>{const id=e.target.dataset.invoice;if(id){const sale=DB.read().sales.find(s=>s.id===id);if(sale)showInvoice(sale);}});
$("profileReturnsTable").addEventListener("click",e=>{const id=e.target.dataset.return;if(!id)return;const r=DB.read().returns.find(x=>x.id===id);if(!r)return;const sale=DB.read().sales.find(x=>x.id===r.saleId);$("returnDetailContent").innerHTML=`<p class="eyebrow">RETURN DETAILS</p><h2>${DB.escape(r.id)}</h2><p><b>Original sale:</b> ${DB.escape(r.saleId)}</p><p><b>Product:</b> ${DB.escape(r.productName)}</p><p><b>Quantity returned:</b> ${Number(r.quantity)||0}</p><p><b>Refund amount:</b> ${DB.money(r.refund)}</p><p><b>Reason:</b> ${DB.escape(r.reason||"—")}</p><p><b>Refund method:</b> ${DB.escape(r.method||"—")}</p><p><b>Status:</b> ${DB.escape(r.status||"Processed")}</p><p><b>Date:</b> ${new Date(r.date).toLocaleString()}</p><p><b>Original customer:</b> ${DB.escape(sale?.customer||"—")}</p>`;$("returnDetailModal").classList.add("show");});
$("closeReturnDetail").addEventListener("click",()=>$("returnDetailModal").classList.remove("show"));
renderDirectory();window.addEventListener("inventoryUpdated",()=>{renderDirectory();renderProfile();});
})();
// =====================================
// ADD CUSTOMER FUNCTIONALITY
// =====================================

const customerForm = document.getElementById("customerForm");

if (customerForm) {
    customerForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const name = document.getElementById("newCustomerName")
            .value.trim();

        const phone = document.getElementById("newCustomerPhone")
            .value.trim();

        const email = document.getElementById("newCustomerEmail")
            .value.trim();

        if (name.length < 2) {
            alert("Please enter a valid customer name.");
            return;
        }

        const db = DB.read();

        // Check duplicate phone or email
        const duplicate = db.customers.find(customer =>
            (phone && customer.phone === phone) ||
            (
                email &&
                customer.email &&
                customer.email.toLowerCase() === email.toLowerCase()
            )
        );

        if (duplicate) {
            alert("Customer already exists!");

            selectedCustomerId = duplicate.id;
            renderDirectory();
            renderProfile();

            return;
        }

        // Create customer
        const newCustomer = {
            id: DB.id("CUS"),
            name: name,
            phone: phone,
            email: email,
            createdAt: new Date().toISOString()
        };

        // Save customer in LocalStorage
        DB.update(function (data) {
            data.customers.push(newCustomer);
        });

        // Select newly added customer
        selectedCustomerId = newCustomer.id;

        // Clear form
        customerForm.reset();

        // Refresh customer directory and profile
        renderDirectory();
        renderProfile();

        alert("Customer added successfully!");

        // Scroll to profile
        const profileSection =
            document.getElementById("profileSection");

        if (profileSection) {
            profileSection.scrollIntoView({
                behavior: "smooth"
            });
        }
    });
}