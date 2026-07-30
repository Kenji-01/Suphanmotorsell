/* ===================================================================
   SUPHAN MOTORSALE — site configuration
   ค่าตั้งค่าเว็บไซต์ (แก้ไขได้โดยไม่ต้องแตะโค้ดส่วนอื่น)

   This is the ONE file to edit when connecting the booking backend.
   ไฟล์นี้คือไฟล์เดียวที่ต้องแก้ เมื่อต่อระบบรับจองเข้ากับ Google Sheet
   =================================================================== */

window.SUPHAN_CONFIG = {

  /* -----------------------------------------------------------------
     Booking endpoint — the Google Apps Script /exec URL.

     ▸ วิธีหา URL นี้: อ่าน scripts/apps-script/SETUP-TH.md
     ▸ ต้องลงท้ายด้วย /exec (ไม่ใช่ /dev)
     ▸ ถ้าเว้นว่างไว้: แบบฟอร์มจองจะแจ้งลูกค้าให้โทรมาที่ร้านแทน
       และหน้าแอดมินจะแสดงคำแนะนำการตั้งค่า

     If this is empty, the booking forms tell the customer to phone the
     shop instead of silently pretending the booking was received.
  ----------------------------------------------------------------- */
  BOOKING_ENDPOINT: '',

  /* -----------------------------------------------------------------
     Fallback phone numbers, shown to a customer when the booking
     cannot be sent (no endpoint configured, or the network failed).
     เบอร์สำรอง แสดงให้ลูกค้าเมื่อส่งแบบฟอร์มไม่สำเร็จ
  ----------------------------------------------------------------- */
  SHOP_PHONE_HQ: '086-798-1091',
  SHOP_PHONE_BANGPLAMA: '094-428-5522',

  /* -----------------------------------------------------------------
     Optional: the Google Sheet that stores the bookings. If set, the
     admin page shows a button that opens it — that is where staff
     delete or edit rows (the Sheet has undo and version history; the
     admin page deliberately has no delete button).
     ไม่บังคับ: ลิงก์ Google Sheet ที่เก็บข้อมูลจอง
  ----------------------------------------------------------------- */
  SHEET_URL: ''
};
