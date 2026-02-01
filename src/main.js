import './style.css'
// นำเข้า Firebase
import { initializeApp } from "firebase/app";
// นำเข้า Firestore สำหรับเก็บข้อมููลโปรโมชั่น Authentication สำหรับระบุสิทธิ
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
// นำเข้า Firestore สำหรับเก็บข้อมููลโปรโมชั่น
import { getFirestore, collection, addDoc, serverTimestamp, getDocs, query, orderBy } from "firebase/firestore";
// นำเข้า Firebase STORAGE สำหรับเก็บรูปภาพ
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// --- Configuration ของFirebase ---
const firebaseConfig = {
  apiKey: "AIzaSyCewzHIU8gC0WcvHl58-_IWWVf_NnbrzVY",
  authDomain: "prayaudornmarket.firebaseapp.com",
  projectId: "prayaudornmarket",
  storageBucket: "prayaudornmarket.firebasestorage.app", // ต้องมีบรรทัดนี้
  messagingSenderId: "1292098719",
  appId: "1:1292098719:web:52b1428c4d1adfe81b56aa",
  measurementId: "G-ECDQ6CP4NQ"
};

// Initialize Firebase ตัวแปรที่เราจะใช้
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app); 

// ดึงส่วนของsection มาเตรียม
window.navigateTo = (pageId) => {
  const pages = document.querySelectorAll('.page-section');
  if (pages.length === 0) {
    window.location.href = 'index.html';
    return;
  }
  //ซ่อนทุุกหน้าไว้ โดยลิ้งไปตาม ID ต่างๆที่ตั้งไว้ ถ
  pages.forEach(page => page.classList.add('hidden-page'));
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.remove('hidden-page');
    targetPage.classList.add('fade-in'); 

    //ถ้าเข้าหน้าโปรโมชั่นให้ดึงข้อมูลจาก Firebase มาแสดง
    if (pageId === 'promotion') {
        window.loadPromotions(); 
    }
  }
  document.querySelectorAll('.nav-link').forEach(link => {
    //เมื่อเปลี่ยนหน้าปุุ่มที่กดค้างไว้จะยกเลิก
    link.classList.remove('nav-link-active');
  });
  //โชว์สีให้รู้ว่ากำลังใช้งานอยู่ที่หน้าไหน
  const activeBtn = document.getElementById(`nav-${pageId}`);
  if (activeBtn) activeBtn.classList.add('nav-link-active');
  
  //ถ้าในมือถือ ให้ปิดแถบทันทีหลังจากเลือกหน้า
  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) mobileMenu.classList.add('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
//ปุุ่มเปิด pop up ตอนล็อคอิน
window.openModal = (id) => {
  const el = document.getElementById(id);
  if (el) { 
    el.classList.remove('hidden');         // เอา Class hidden ออกเพื่อให้หน้าต่างเด้งมา
    document.body.style.overflow = 'hidden'; // สั่ง ล็อกหน้าเว็บไม่ให้เลื่อนขึ้นลงได้ขณะเปิด Pop-up
  }

}
//ปุุ่มปิด pop up ตอนล็อคอิน
window.closeModal = (id) => {
  const el = document.getElementById(id); // ใส่ Class hidden กลับเข้าไปเพื่อซ่อนหน้าต่าง
  if (el) { el.classList.add('hidden'); document.body.style.overflow = 'auto'; } // ปลดล็อกหน้าเว็บให้กลับมาเลื่อนขึ้นลงได้ตามปกติ
}
//ฟังก์ชั่น ซ่อนpassword 
window.togglePassword = () => {
    const inputs = document.querySelectorAll('input[type="password"]');
    inputs.forEach(input => { input.type = input.type === "password" ? "text" : "password"; });
}

window.handleLogin = async (event) => {
    event.preventDefault();
    //ดึงข้อมูลมาเก็บไว้
    const emailField = document.getElementById('emailInput');
    const passwordField = document.getElementById('passwordInput');
    const submitBtn = event.target.querySelector('button[type="submit"]'); //หาปุ่มกดส่ง เพื่อเตรียมจัดการสถานะของปุ่ม

    if (!emailField || !passwordField) return;
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "กำลังตรวจสอบ...";
    submitBtn.disabled = true; 
    try {
        await signInWithEmailAndPassword(auth, emailField.value, passwordField.value);
        alert("✅ เข้าสู่ระบบสำเร็จ!");
        window.closeModal('loginModal');
        window.location.href = "kormoon.html";
    } catch (error) {
        console.error("Login Error:", error.code);
        alert("❌ อีเมลหรือรหัสผ่านไม่ถูกต้อง"); 
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

//ระบบ สมัคร
window.handleSignup = async (event) => {
    event.preventDefault();
    // ดึงค่าอีเมล รหัสผ่านและการยืนยันรหัสผ่านที่ผู้ใช้พิมพ์มาเก็บไว้
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    const submitBtn = event.target.querySelector('button[type="submit"]');
    //เช็กว่ารหัสผ่านทั้ง 2 ช่องตรงกันไหม
    if (password !== confirmPassword) { alert("❌ รหัสผ่านไม่ตรงกัน"); return; }
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "กำลังบันทึก...";
    submitBtn.disabled = true; //ล็อกปุ่ม ไม่ให้กดซ้ำระหว่างรอระบบสร้างบัญชี
    try {
        await createUserWithEmailAndPassword(auth, email, password); //สั่งให้ Firebase สร้างบัญชีผู้ใช้ใหม่ด้วยอีเมลและรหัสผ่านที่ระบุ
        alert("✅ สมัครสมาชิกสำเร็จ!");
        window.closeModal('signupModal');
        window.location.href = "kormoon.html"; //่ลิ้งค์ไปหน้า Kormoon
    } catch (error) {
        alert("❌ เกิดข้อผิดพลาด: " + error.message);
    } finally {
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}
window.handleLogout = async () => {
    try { await signOut(auth); alert("ออกจากระบบเรียบร้อย"); window.location.href = "index.html"; } catch (error) { console.error(error); }
}

// Firestore Logic บันทึกรูป 
window.savePromotion = async (event) => {
    event.preventDefault();
    
    const user = auth.currentUser;
    if (!user) {
        alert("กรุณาเข้าสู่ระบบก่อนทำรายการ");
        window.location.href = "index.html";
        return;
    }

    const btn = document.getElementById('btnSubmit');
    const originalText = btn.innerText;
    
    // รับค่าจาก Input File
    const imageInput = document.getElementById('shopImage'); 
    const file = imageInput.files[0];

    btn.innerText = "กำลังอัปโหลด...";
    btn.disabled = true;

    try {
        let imageUrl = ""; // ค่าเริ่มต้นเป็นว่าง

        // ถ้ามีการเลือกรูป ให้ทำการอัปโหลด
        if (file) {
            // ตั้งชื่อไฟล์ (ใช้เวลาปัจจุบัน + ชื่อไฟล์เดิม กันชื่อซ้ำ)
            const fileName = `promotions/${Date.now()}_${file.name}`;
            const storageRef = ref(storage, fileName);
            
            // สั่งอัปโหลดขึ้น Firebase Storage
            const snapshot = await uploadBytes(storageRef, file);
            
            // ขอลิงก์รูป (URL) กลับมา
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // บันทึกลง Firestore พร้อมลิงก์รูป
        await addDoc(collection(db, "promotions"), {
            uid: user.uid,
            email: user.email,
            shop_name: document.getElementById('shopName').value,
            contact_phone: document.getElementById('shopPhone').value,
            contact_email: document.getElementById('shopEmail').value,
            promotion_detail: document.getElementById('shopDetail').value,
            image_url: imageUrl, 
            created_at: serverTimestamp()
        });

        alert("✅ บันทึกข้อมูลและอัปโหลดรูปเรียบร้อย!");
        event.target.reset();
        window.location.href = "index.html"; 
    } catch (e) {
        console.error("Error: ", e);
        alert("❌ เกิดข้อผิดพลาด: " + e.message);
    } finally {
        btn.innerText = originalText;
        btn.disabled = false;
    }
}

// ดึงข้อมูลมาแสดง
window.loadPromotions = async () => {
    const container = document.getElementById('promotion-list'); //ระบุพื้นที่ในหน้าเว็บที่จะแสดงข้อมูล
    if (!container) return;

    container.innerHTML = '<div class="text-center py-10"><p class="text-[#ff6600] animate-pulse">กำลังโหลดโปรโมชั่น...</p></div>';

    try {
        const q = query(collection(db, "promotions"), orderBy("created_at", "desc"));//เรียงสถานะข้อมูลจากใหม่ไปเก่า
        const querySnapshot = await getDocs(q); 

        if (querySnapshot.empty) {
            container.innerHTML = '<div class="text-center py-10 text-gray-500">ยังไม่มีโปรโมชั่นขณะนี้</div>';
            return;
        }

        let html = '';
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            
            // ถ้ามีรููปใช้อันที่อัปโหลด ถ้าไม่มีใช้รูปจำลอง
            const displayImage = data.image_url ? data.image_url : `https://placehold.co/600x600?text=${data.shop_name}`; //ถ้าไม่มี ให้สร้างรูปจำลอง
            //เตรียม HTML ไวโดยเอาข้อมูลจากฐานข้อมูลมาหยอดใส่ตามจุดต่าง ๆ
            html += `
            <div class="bg-white rounded-xl shadow-xl overflow-hidden hover:shadow-2xl transition duration-300 border border-gray-100">
                <div class="grid grid-cols-1 lg:grid-cols-2">
                    <div class="p-8 lg:p-16 flex flex-col justify-center order-2 lg:order-1">
                        <h2 class="text-3xl lg:text-4xl font-bold mb-2">
                            <span class="text-[#ff6600]">${data.shop_name}</span> 
                        </h2>
                        <h3 class="text-2xl lg:text-3xl font-bold text-gray-800 mb-6">
                           ติดต่อ: ${data.contact_phone}
                        </h3>
                        <p class="text-gray-500 mb-10 leading-relaxed font-light text-lg">
                            ${data.promotion_detail}
                        </p>
                        <div class="flex flex-wrap gap-4">
                            <button onclick="window.location.href='tel:${data.contact_phone}'" class="bg-[#ff6600] text-white px-8 py-3 rounded hover:bg-orange-700 transition shadow-sm font-bold">
                                โทรติดต่อร้าน
                            </button>
                            <button onclick="navigateTo('map')" class="border border-[#ff6600] text-[#ff6600] px-8 py-3 rounded hover:bg-orange-50 transition font-bold">
                                ดูตำแหน่งร้าน
                            </button>
                        </div>
                    </div>
                    <div class="h-64 lg:h-auto min-h-[300px] relative bg-gray-200 order-1 lg:order-2">
                        <img src="${displayImage}" alt="${data.shop_name}" class="absolute inset-0 w-full h-full object-cover">
                    </div>
                </div>
            </div>
            `;
        });

        container.innerHTML = html; //เมื่อวนลูปสร้างการ์ดของทุกร้านครบแล้ว ก็นำ HTML ทั้งหมดไปลงในหน้าเว็บทีเดียว

    } catch (error) {
        console.error("Error:", error);
        container.innerHTML = `<p class="text-center text-red-500">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>`;
    }
}

//ตั้งค่าเมื่อโหลดเว็ปเวร็จ
document.addEventListener('DOMContentLoaded', () => { //สั่งให้รอจนกว่าเบราว์เซอร์จะโหลดหน้าเว็บเสร็จก่อน
    onAuthStateChanged(auth, (user) => { 
        if (window.location.pathname.includes('kormoon.html') && !user) {
           //ระบบเฝ้าดูสถานะล็อกอิน ถ้าพบว่าอยู่ในหน้า kormoon.html แต่ไม่ได้ล็อกอิน จะไล่กลับหน้าแรก
        }
    });
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menu = document.getElementById('mobile-menu');
    if (menuBtn && menu) {
        menuBtn.onclick = () => menu.classList.toggle('hidden');//ตั้งค่าปุ่มเมนูมือถือ สามขีดให้กดแล้วสลับ ระหว่างการเปิดและปิดเมนู
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { 
            ['loginModal', 'signupModal'].forEach(id => window.closeModal(id));
        }
    }); //สร้างคีย์ลัด ESC
    if (!document.getElementById('promotion').classList.contains('hidden-page')) {
        window.loadPromotions();
    }
});