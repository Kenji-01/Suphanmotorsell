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
  BOOKING_ENDPOINT: 'https://script.google.com/macros/s/AKfycbwnUYkInjx7H7hl4f_VHeRUb2_O-WmhvvI6KIBxtB8e2XxodvrMwW6iAUkiSPBBXnru3g/exec',

  /* -----------------------------------------------------------------
     Fallback phone numbers, shown to a customer when the booking
     cannot be sent (no endpoint configured, or the network failed).
     เบอร์สำรอง แสดงให้ลูกค้าเมื่อส่งแบบฟอร์มไม่สำเร็จ
  ----------------------------------------------------------------- */
  SHOP_PHONE_HQ: '086-798-1091',
  SHOP_PHONE_BANGPLAMA: '094-428-5522'

  /* There used to be a SHEET_URL setting here for an "open Google Sheet"
     shortcut button on admin.html. Removed: this file is downloaded by
     every visitor to every page (customers included), not just staff —
     unlike BOOKING_ENDPOINT, which is meant to be public (customers'
     browsers call it directly to submit a booking), a direct link to
     the Sheet holding customer names and phone numbers has no business
     being in a file anyone can view-source. Just bookmark the Sheet in
     your own browser instead. */
};
