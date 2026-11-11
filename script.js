const STORAGE_KEY = "aiWhtHistoryV1";
const LAW = {
  rent:{rate:5,clause:"ท.ป.4/2528 ข้อ 6",url:"https://www.rd.go.th/3479.html",why:"ค่าเช่าทรัพย์สินตามหลักเกณฑ์ข้อ 6"},
  contract:{rate:3,clause:"ท.ป.4/2528 ข้อ 8",url:"https://www.rd.go.th/3479.html",why:"ค่าจ้างทำของที่เข้าเงื่อนไขตามข้อ 8"},
  advertising:{rate:2,clause:"ท.ป.4/2528 ข้อ 10",url:"https://www.rd.go.th/3479.html",why:"ค่าโฆษณาตามข้อ 10"},
  service:{rate:3,clause:"ท.ป.4/2528 ข้อ 12/1",url:"https://www.rd.go.th/3479.html",why:"บริการอื่นตามข้อ 12/1 ซึ่งไม่ใช่ประเภทที่ยกเว้นหรือมีข้อกำหนดเฉพาะ"},
  transport:{rate:1,clause:"ท.ป.4/2528 ข้อ 12/4",url:"https://www.rd.go.th/3479.html",why:"ค่าขนส่งที่ไม่ใช่ค่าโดยสารสำหรับการขนส่งสาธารณะ"}
};
const $ = id => document.getElementById(id);
const money = n => new Intl.NumberFormat("th-TH",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(n)||0);
const getHistory = () => {try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]")}catch{return []}};
const saveHistory = list => localStorage.setItem(STORAGE_KEY,JSON.stringify(list));
function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function showPage(name){
 document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${name}`));
 document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===name));
 const titles={dashboard:"Dashboard",analyze:"วิเคราะห์ภาษี",history:"ประวัติการคำนวณ",knowledge:"ฐานความรู้ทางภาษี",about:"เกี่ยวกับระบบ"};
 $("pageTitle").textContent=titles[name]||"Dashboard";$("sidebar").classList.remove("open");
 if(name==="dashboard")renderDashboard();if(name==="history")renderHistory();
}
document.addEventListener("click",e=>{
 const nav=e.target.closest("[data-page]");if(nav)showPage(nav.dataset.page);
 const go=e.target.closest("[data-go]");if(go)showPage(go.dataset.go);
});
$("mobileMenu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("vatRate").addEventListener("change",()=> $("customVatWrap").classList.toggle("hidden",$("vatRate").value!=="custom"));
$("paymentDate").value=new Date().toISOString().slice(0,10);
$("todayText").textContent=new Intl.DateTimeFormat("th-TH",{dateStyle:"medium"}).format(new Date());

function analyze(data){
 const base={...data,vat:data.amount*data.vatRate/100,gross:data.amount*(1+data.vatRate/100),tax:0,rate:null,base:data.amount,net:null,form:"ไม่สามารถระบุแบบได้",status:"review",statusText:"ต้องตรวจสอบหลักเกณฑ์ทางกฎหมายเพิ่มเติม",reason:[],warnings:[],law:null};
 const fail=(reason,warn=[])=>({...base,reason:[reason],warnings:warn});
 if(!data.payerName||!data.payeeName||!data.description||!data.paymentDate||!data.payerType||!data.payeeType||!data.residence||!data.type||!(data.amount>0)||data.vatRate<0||data.vatRate>100)return fail("ข้อมูลจำเป็นไม่ครบหรือจำนวนเงินไม่ถูกต้อง",["กรุณากรอกข้อมูลทุกช่องที่จำเป็นก่อนวิเคราะห์"]);
 if(data.residence!=="thai")return fail("ถิ่นที่อยู่หรือสถานะการประกอบกิจการของผู้รับเงินไม่เข้าเงื่อนไขที่ระบบต้นแบบรองรับ",["กรณีผู้รับเงินต่างประเทศหรือไม่ทราบถิ่นที่อยู่ อาจมีประเด็นภาษีระหว่างประเทศและ ภ.ง.ด.54 ต้องให้ผู้เชี่ยวชาญตรวจสอบ"]);
 if(data.payerType!=="juristic")return fail("ผู้จ่ายเงินไม่ใช่บริษัท/นิติบุคคลตามขอบเขตกฎอัตโนมัติที่ระบบบันทึกไว้",["การหักภาษีของผู้จ่ายประเภทอื่นอาจใช้บทบัญญัติหรือหลักเกณฑ์ต่างกัน"]);
 if(data.payeeType==="foundation")return fail("ผู้รับเป็นมูลนิธิ/สมาคม ซึ่งอาจมีอัตราและข้อยกเว้นเฉพาะ",["ต้องตรวจสอบสถานะและลักษณะการประกอบกิจการของมูลนิธิ/สมาคม"]);
 if(data.payeeType==="foreign")return fail("ผู้รับเป็นนิติบุคคลต่างประเทศ ต้องพิจารณาสถานประกอบการถาวรและอนุสัญญาภาษีซ้อน",["อย่านำอัตราสำหรับผู้มีถิ่นที่อยู่ในไทยมาใช้"]);
 if(data.type==="unknown"||data.type==="other")return fail("รายละเอียดไม่เพียงพอที่จะจำแนกประเภทเงินได้ตามกฎหมาย",["ต้องทราบลักษณะงาน สัญญา และสิ่งตอบแทนที่แท้จริง"]);
 if(data.type==="goods"){
   return {...base,status:"no",statusText:"โดยหลักไม่หัก (กรณีซื้อขายสินค้าทั่วไป)",rate:0,tax:0,net:base.gross,form:"ไม่ใช้แบบหัก ณ ที่จ่ายจากข้อมูลที่ให้",reason:["การซื้อขายสินค้าทั่วไปโดยแท้จริง โดยหลักไม่อยู่ในรายการหักตามกฎทั่วไปที่ระบบนำมาใช้","หากมีค่าบริการ/ค่าขนส่งแยกเป็นสัญญาหรือผู้ขายเป็นผู้ให้บริการขนส่ง ต้องแยกพิจารณา"],warnings:["ยืนยันว่าเป็นการซื้อสินค้าแท้จริง ไม่ใช่สัญญาจ้างทำของหรือบริการ","หากค่าจัดส่งเรียกเก็บแยกโดยผู้ขนส่ง ให้ตรวจสอบผู้รับเงินและเอกสารแยกต่างหาก"],law:{clause:"แนวคำชี้แจงกรมสรรพากรเกี่ยวกับการซื้อสินค้าและค่าขนส่ง",url:"https://www.rd.go.th/3326.html"}};
 }
 if(data.type==="hotel"||data.type==="restaurant"){
   return {...base,status:"no",statusText:"ไม่หักตามข้อยกเว้นที่อ้างอิง",rate:0,tax:0,net:base.gross,form:"ไม่ใช้แบบหัก ณ ที่จ่ายจากรายการนี้",reason:[data.type==="hotel"?"คำสั่ง ท.ป.4/2528 ข้อ 12/1 ระบุยกเว้นค่าบริการของโรงแรม":"คำสั่ง ท.ป.4/2528 ข้อ 12/1 ระบุยกเว้นค่าบริการของภัตตาคาร"],warnings:["ต้องเป็นค่าบริการโรงแรม/ภัตตาคารตามลักษณะจริง ไม่ใช่ค่าเช่าพื้นที่หรือบริการอื่นที่แยกต่างหาก"],law:{clause:"ท.ป.4/2528 ข้อ 12/1",url:"https://www.rd.go.th/3479.html"}};
 }
 const rule=LAW[data.type];
 if(!rule)return fail("ไม่พบกฎที่ยืนยันได้สำหรับประเภทธุรกรรมนี้");
 if(data.type==="transport")return fail("ค่าขนส่งต้องแยกจากค่าโดยสารขนส่งสาธารณะและตรวจสอบผู้ให้บริการก่อน",["หากเป็นค่าโดยสารขนส่งสาธารณะ อาจได้รับยกเว้นตามหลักเกณฑ์","หากเป็นค่าขนส่งสินค้า ข้อ 12/4 ระบุอัตรา 1% ภายใต้เงื่อนไขที่กำหนด"],);
 if(data.amount<1000)return fail("ยอดตามสัญญาอาจต่ำกว่าเกณฑ์ขั้นต่ำที่กำหนดในข้อ 12/7",["ระบบไม่ตัดสินข้อยกเว้นนี้โดยอัตโนมัติ เพราะต้องพิจารณายอดตามสัญญารายหนึ่ง ๆ ไม่ใช่เฉพาะยอดจ่ายครั้งนี้"]);
 if(data.type==="rent"&&data.special.toLowerCase().includes("อาคารหรือโรงเรือนที่ได้รับกรรมสิทธิ์"))return fail("ลักษณะค่าเช่าที่ระบุอาจเข้าข้อยกเว้นเฉพาะตามข้อ 6",["ต้องตรวจสอบรายละเอียดกรรมสิทธิ์และสัญญา"]);
 if(data.type==="service"&&/โรงแรม|ภัตตาคาร|ร้านอาหาร/.test(data.description))return fail("บริการที่ระบุอาจเป็นบริการโรงแรมหรือภัตตาคารซึ่งมีข้อยกเว้นเฉพาะ",["โปรดเลือกประเภทค่าบริการโรงแรม/ภัตตาคาร หากตรงกับธุรกรรมจริง"]);
 const rate=rule.rate, tax=base.base*rate/100, form=data.payeeType==="individual"?"ภ.ง.ด.3":"ภ.ง.ด.53";
 return {...base,status:"ok",statusText:"เข้าเงื่อนไขคำนวณตามกฎที่ระบบอ้างอิง",rate,tax,net:base.gross-tax,form,reason:[rule.why,`ผู้จ่ายเป็นบริษัท/นิติบุคคล และผู้รับเป็น${data.payeeType==="individual"?"บุคคลธรรมดา":"นิติบุคคล"}ที่ระบุว่าประกอบกิจการ/มีถิ่นที่อยู่ในประเทศไทย`,`คำนวณจากฐานเงินได้ก่อน VAT ตามข้อมูลที่กรอก`],warnings:["ตรวจสอบสัญญา ใบแจ้งหนี้ และสถานะผู้รับเงินก่อนนำไปใช้จริง","อัตราที่แสดงเป็นอัตราตามหลักเกณฑ์ทั่วไปที่ระบบบันทึก ไม่ครอบคลุมกรณีพิเศษหรืออนุสัญญาภาษีซ้อน"],law:rule};
}
function renderResult(result,container,save=false){
 const statusClass=result.status==="ok"?"status-ok":result.status==="no"?"status-no":"status-review";
 const rate=result.rate===null?"—":`${result.rate}%`;
 const tax=result.tax===null? "ยังคำนวณไม่ได้":`฿${money(result.tax)}`;
 const net=result.net===null?"ยังคำนวณไม่ได้":`฿${money(result.net)}`;
 const law=result.law?`<a href="${result.law.url}" target="_blank" rel="noopener">${escapeHTML(result.law.clause)} ↗</a>`:"ต้องตรวจสอบหลักเกณฑ์ทางกฎหมายเพิ่มเติม";
 container.innerHTML=`<article class="result-card"><div class="result-head"><div><h3>ผลการวิเคราะห์</h3><p>${escapeHTML(result.description||"รายการที่วิเคราะห์")} · ${escapeHTML(result.paymentDate||"")}</p></div><span class="pill ${statusClass}">${escapeHTML(result.statusText)}</span></div>
 <div class="result-grid">
 <div class="metric"><span>ประเภทเงินได้</span><strong>${escapeHTML(typeName(result.type))}</strong></div>
 <div class="metric"><span>ต้องหักภาษีหรือไม่</span><strong>${result.status==="ok"?"ต้องหัก":result.status==="no"?"ไม่หัก":"รอตรวจสอบ"}</strong></div>
 <div class="metric"><span>อัตราภาษี</span><strong>${rate}</strong></div>
 <div class="metric"><span>ฐานคำนวณภาษี</span><strong>฿${money(result.base)}</strong></div>
 <div class="metric"><span>ภาษีหัก ณ ที่จ่าย</span><strong>${tax}</strong></div>
 <div class="metric"><span>VAT (${result.vatRate}%)</span><strong>฿${money(result.vat)}</strong></div>
 <div class="metric highlight"><span>ยอดเงินสุทธิที่ต้องจ่าย</span><strong>${net}</strong></div>
 <div class="metric"><span>แบบนำส่งภาษี</span><strong>${escapeHTML(result.form)}</strong></div>
 <div class="metric"><span>ยอดรวมก่อนหักภาษี</span><strong>฿${money(result.gross)}</strong></div></div>
 <div class="result-detail"><div class="detail-box"><h4>เหตุผลในการวิเคราะห์</h4><ul>${(result.reason||[]).map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul><p><b>แหล่งอ้างอิง:</b> ${law}</p></div><div class="detail-box"><h4>สูตรและข้อควรระวัง</h4><div class="formula">VAT = ฐานเงิน × VAT%<br>ภาษีหัก = ฐานเงินก่อน VAT × อัตราหัก<br>ยอดสุทธิ = ฐานเงิน + VAT − ภาษีหัก</div><ul>${(result.warnings||[]).map(x=>`<li>${escapeHTML(x)}</li>`).join("")}</ul></div></div>
 <p class="muted small">ผลลัพธ์นี้เป็นการประมวลผลตามข้อมูลที่ผู้ใช้กรอกและกฎที่ระบุในระบบต้นแบบเท่านั้น โปรดตรวจสอบกฎหมายฉบับปัจจุบันก่อนใช้งานจริง</p>
 ${save?'<div class="form-actions"><button class="btn btn-outline" id="saveResult">บันทึกผลในประวัติ</button></div>':""}</article>`;
 if(save){$("saveResult").addEventListener("click",()=>{const h=getHistory();h.unshift({...result,id:Date.now(),createdAt:new Date().toISOString()});saveHistory(h);toast("บันทึกผลการวิเคราะห์แล้ว");renderDashboard();$("saveResult").disabled=true;$("saveResult").textContent="บันทึกแล้ว";});}
}
function typeName(t){return ({rent:"ค่าเช่า",service:"ค่าบริการ",contract:"ค่าจ้างทำของ",advertising:"ค่าโฆษณา",transport:"ค่าขนส่ง",goods:"การซื้อสินค้า",hotel:"ค่าบริการโรงแรม",restaurant:"ค่าภัตตาคาร",other:"รายการอื่น",unknown:"ต้องตรวจสอบเพิ่มเติม"})[t]||"ไม่ระบุ";}
function escapeHTML(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function readForm(){const vatRate=$("vatRate").value==="custom"?Number($("customVat").value):Number($("vatRate").value);return {payerName:$("payerName").value.trim(),payerType:$("payerType").value,payeeName:$("payeeName").value.trim(),payeeType:$("payeeType").value,residence:$("residence").value,description:$("description").value.trim(),type:$("incomeType").value,amount:Number($("amount").value),vatRate,paymentDate:$("paymentDate").value,special:$("special").value.trim()};}
$("taxForm").addEventListener("submit",e=>{e.preventDefault();const data=readForm();const required=["payerName","payerType","payeeName","payeeType","residence","description","type","amount","paymentDate"];const missing=required.filter(id=>!$(id).value);if(missing.length||!(data.amount>0)||data.vatRate<0||data.vatRate>100){$("analysisResult").innerHTML='<div class="result-card"><span class="pill status-review">ข้อมูลไม่ครบ</span><p>กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน และตรวจสอบจำนวนเงิน / อัตรา VAT ก่อนวิเคราะห์</p></div>';return;}const result=analyze(data);renderResult(result,$("analysisResult"),true);$("analysisResult").scrollIntoView({behavior:"smooth",block:"start"});});
$("taxForm").addEventListener("reset",()=>setTimeout(()=>{$("analysisResult").innerHTML="";$("customVatWrap").classList.add("hidden");$("paymentDate").value=new Date().toISOString().slice(0,10)},0));

function renderDashboard(){const h=getHistory();$("statTotal").textContent=h.length;$("statConfirmed").textContent=h.filter(x=>x.status==="ok"||x.status==="no").length;$("statReview").textContent=h.filter(x=>x.status==="review").length;$("statTax").textContent="฿"+money(h.reduce((s,x)=>s+(x.tax||0),0));const recent=h.slice(0,5);$("recentList").innerHTML=recent.length?`<div class="table-wrap"><table><thead><tr><th>วันที่</th><th>รายการ</th><th>สถานะ</th><th>ภาษี</th></tr></thead><tbody>${recent.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleDateString("th-TH")}</td><td>${escapeHTML(x.description)}</td><td>${escapeHTML(x.statusText)}</td><td>${x.tax===null?"—":"฿"+money(x.tax)}</td></tr>`).join("")}</tbody></table></div>`:'<div class="empty-state">ยังไม่มีประวัติการวิเคราะห์ เริ่มต้นได้จากเมนู “วิเคราะห์ภาษี”</div>';}
function renderHistory(){const h=getHistory();$("historyTable").innerHTML=h.length?`<div class="table-wrap"><table><thead><tr><th>วันที่บันทึก</th><th>รายละเอียด</th><th>ประเภท</th><th>สถานะ</th><th>ภาษี</th><th>จัดการ</th></tr></thead><tbody>${h.map(x=>`<tr><td>${new Date(x.createdAt).toLocaleString("th-TH")}</td><td>${escapeHTML(x.description)}</td><td>${typeName(x.type)}</td><td>${escapeHTML(x.statusText)}</td><td>${x.tax===null?"—":"฿"+money(x.tax)}</td><td><button class="btn btn-outline btn-sm" data-view="${x.id}">ดู</button> <button class="btn btn-danger-outline btn-sm" data-delete="${x.id}">ลบ</button></td></tr>`).join("")}</tbody></table></div>`:'<div class="empty-state">ไม่มีประวัติการคำนวณ</div>';}
$("historyTable").addEventListener("click",e=>{const view=e.target.closest("[data-view]"),del=e.target.closest("[data-delete]");if(view){const item=getHistory().find(x=>x.id===Number(view.dataset.view));if(item){showPage("history");const box=document.createElement("div");box.className="result-area";$("historyTable").after(box);renderResult(item,box,false);box.scrollIntoView({behavior:"smooth"});}}if(del){saveHistory(getHistory().filter(x=>x.id!==Number(del.dataset.delete)));renderHistory();renderDashboard();toast("ลบรายการแล้ว");}});
$("clearHistory").addEventListener("click",()=>{if(confirm("ต้องการลบประวัติการคำนวณทั้งหมดหรือไม่?")){saveHistory([]);renderHistory();renderDashboard();toast("ลบประวัติทั้งหมดแล้ว");}});
renderDashboard();
