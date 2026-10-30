// src/scripts/v3f-hero-scroll.js
(function() {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FRAMES = ["/uploads/J3wRXgl2CIe2zqvQBofTK-frame_0001.webp", "/uploads/yam73_n3CX32SFcRJXp99-frame_0002.webp", "/uploads/1EVr9QKsTWNgBzBIpMSNR-frame_0003.webp", "/uploads/UH2PaSZQFvMzk-m58lSGa-frame_0004.webp", "/uploads/xXeS1wM4nlX3oTtNkiW2--frame_0005.webp", "/uploads/zQ3KIHKblGCb2d71PIwLy-frame_0006.webp", "/uploads/tOtbI8Uls-8YaHxqn1SUM-frame_0007.webp", "/uploads/axZsddi46V3XCvBeMz1Bl-frame_0008.webp", "/uploads/HCBO1LLxlQQbs6oVNShi1-frame_0009.webp", "/uploads/OVJKQ7EC7DWZ0SbTQxCoJ-frame_0010.webp", "/uploads/oIAa5y_s54CJnGL_c-E-i-frame_0011.webp", "/uploads/-ZkiTO5uFQZI9bhm-uxeq-frame_0012.webp", "/uploads/KO6giGQPf7oDyYQ4EY_v1-frame_0013.webp", "/uploads/a7ZSkw0Ec5J3VywlmrCIK-frame_0014.webp", "/uploads/XKZkj4_e2wXHe1_sk7mSA-frame_0015.webp", "/uploads/ENziZ529GqMUo2_SDW-xK-frame_0016.webp", "/uploads/Dl7AjvnnblvQF3pOgWWbY-frame_0017.webp", "/uploads/zQ4Ve1YdFnq2ZpCd-S08Q-frame_0018.webp", "/uploads/yleYNBSDNR1u2GZc-V2UA-frame_0019.webp", "/uploads/wfs7gFYFst6HASdv0Gqw4-frame_0020.webp", "/uploads/NZ_83DpLGqVo7SwV7qJbT-frame_0021.webp", "/uploads/Oih6m4rxqQYAuuw1hjg7R-frame_0022.webp", "/uploads/YhOgAxTIvMUKnAzD60IOc-frame_0023.webp", "/uploads/4G4_zNqeoEv6WN-qJXM7u-frame_0024.webp", "/uploads/GFbpcZUnXJWgpdp0VABzP-frame_0025.webp", "/uploads/QJeSlwhRi4JqQIhPVRunI-frame_0026.webp", "/uploads/A719VNs-BBkYjjzU5ZVwz-frame_0027.webp", "/uploads/rCIjZz9CQG-hwjO0aYNkw-frame_0028.webp", "/uploads/aUDUhB7Iba2cTOatTf2Og-frame_0029.webp", "/uploads/ZR0AuTFuCdeKQicy-gmis-frame_0030.webp", "/uploads/dppqbr05rat3j5SX4_7WX-frame_0031.webp", "/uploads/hOdZ8MfGeWKteh4t0_n39-frame_0032.webp", "/uploads/oIIragBmaO0DT-39adZnL-frame_0033.webp", "/uploads/7QzbZsozRuyDnfjoO5IVn-frame_0034.webp", "/uploads/ZvAppFRq-o7HcMUra0vV5-frame_0035.webp", "/uploads/KiZKbRKnEZDl1tOeYhIDl-frame_0036.webp", "/uploads/1Nqe8S7ZkG3nFoDgCeqnx-frame_0037.webp", "/uploads/0nBRXvc14COnnRU3zGsXK-frame_0038.webp", "/uploads/9lLhtT5J4_0Pc62qT8-xf-frame_0039.webp", "/uploads/Xwd8hGRGyyZ8GqX0qvFJm-frame_0040.webp", "/uploads/Y1SjS-AS23oBAbtL80o62-frame_0041.webp", "/uploads/20UpO0oNVf6aXpAwn4eOE-frame_0042.webp", "/uploads/9fOIVnEGQV9aXuUIEBXwL-frame_0043.webp", "/uploads/tjbuNXkyLGVxNZVbB_W9t-frame_0044.webp", "/uploads/Gd0-So_JVmUW0LqrSuXNV-frame_0045.webp", "/uploads/gDn9-7bYWNI5vdbWZMLKN-frame_0046.webp", "/uploads/OUvbWjg-k9GhJN238dHwG-frame_0047.webp", "/uploads/nAM1cKARZ9sM895dkNSFV-frame_0048.webp", "/uploads/6x7Ik59iFIRLPLpBfS1Om-frame_0049.webp", "/uploads/yP5sjXyHsNxa1YXoHi3qx-frame_0050.webp", "/uploads/dd0NlkgSpnqPJS2WKJkzF-frame_0051.webp", "/uploads/3t4OT-rYSnSLAGiba8NL5-frame_0052.webp", "/uploads/I_u5YVZ4AW2P7NVaMlB3Y-frame_0053.webp", "/uploads/MTowk4BzTb_5Ai86kDUnB-frame_0054.webp", "/uploads/HShS1oM60EIJRdcR2DCUP-frame_0055.webp", "/uploads/QnhLETwIBfPEdqndcW8nc-frame_0056.webp", "/uploads/sMQobeROYZHJmB4E9TpdY-frame_0057.webp", "/uploads/zzIBnFjhxHGStD1dE9B09-frame_0058.webp", "/uploads/6d0XVrcW3ji2dGmdTXMOE-frame_0059.webp", "/uploads/0s_RSFbetsTigTpgsokJF-frame_0060.webp", "/uploads/0csvD02oANlOXItfBjjEY-frame_0061.webp", "/uploads/HbHzMgdzsEBinM2_Tca-6-frame_0062.webp", "/uploads/ba4bPMct3-9ZUrTr4oLEi-frame_0063.webp", "/uploads/OU8ezK4cbc257nBL00s1V-frame_0064.webp", "/uploads/ppSHjVB7ovK1ieFMCzrcF-frame_0065.webp", "/uploads/HjtE_qYT-9FLXM-aU1TT--frame_0066.webp", "/uploads/sxjTvwf-ZgpqqGMzJ9U_Y-frame_0067.webp", "/uploads/T1BgFA_-4_jbd9dFiLWjR-frame_0068.webp", "/uploads/zO2tDQmbde720hNHwSXZX-frame_0069.webp", "/uploads/4yzPou0ndf9MmIH8zoRbb-frame_0070.webp", "/uploads/0f52KO8vBYlMisp-iOtFx-frame_0071.webp", "/uploads/G2667yFUQuDEJ9NlXp38r-frame_0072.webp", "/uploads/MFkfWLvcL9iwP0qEO5c6I-frame_0073.webp", "/uploads/qW1X6PnHdAkB-OEyvpyxa-frame_0074.webp", "/uploads/zA5-jhmskXunt7aZXK25O-frame_0075.webp", "/uploads/Jp0gky7MFIT8mfsWLov-l-frame_0076.webp", "/uploads/00bsx-bcOGV4YJ7_kVtaE-frame_0077.webp", "/uploads/Ayq7sUGY1Ry4w-YTY1xTM-frame_0078.webp", "/uploads/Aga80JEHHkNu-J0w7emRB-frame_0079.webp", "/uploads/4XHS4mgYnR6DDfbu0dDAK-frame_0080.webp", "/uploads/c_9GhtfGgoIYrY8GNXgxf-frame_0081.webp", "/uploads/TGnn9pb3HYF7U9olx-3x0-frame_0082.webp", "/uploads/GJG8S7VPNvOPpmvDKl5L4-frame_0083.webp", "/uploads/_KUoG_i5GtK6It9QDpst4-frame_0084.webp", "/uploads/S66_xZwzeT5_7X_yWRB9m-frame_0085.webp", "/uploads/_Trrw58Tp7xQtbd-TvaDm-frame_0086.webp", "/uploads/FCjvhXbP61sROvlly9Rvc-frame_0087.webp", "/uploads/eUzCaurRHq3hfV0j2II2M-frame_0088.webp", "/uploads/kX498vOKjBaHvSCayOYFB-frame_0089.webp", "/uploads/xjnb3-l3H_uA9BUpolmd6-frame_0090.webp", "/uploads/RUYE0huWaQcYud0uok1e4-frame_0091.webp", "/uploads/7E951Zcpku_5lFMKfEXU4-frame_0092.webp", "/uploads/9PYFlkq3GzkP4go4jQetn-frame_0093.webp", "/uploads/3UdB0_3riSJRBMr6pCOVi-frame_0094.webp", "/uploads/D-ZH9a1IVx96LZaIctKRJ-frame_0095.webp", "/uploads/nb-sKDpNtHohkAQKQHgG1-frame_0096.webp", "/uploads/ttGgSnnx4gsxyPavOdgIy-frame_0097.webp", "/uploads/usSuyNCkha6eDXKwmhn82-frame_0098.webp", "/uploads/_ab0S_ovrb2T-U3h7lhy8-frame_0099.webp", "/uploads/b_FzH6qeieB2M801zZxPq-frame_0100.webp", "/uploads/pNTe2-RwI4D0QYuIserNh-frame_0101.webp", "/uploads/f3h9LZLO3sK9YkI7eVBjc-frame_0102.webp", "/uploads/j7fXUanjaG_EZ-IlvmO_y-frame_0103.webp", "/uploads/wisAFvfVNH3sXMNPg8xoy-frame_0104.webp", "/uploads/nDISeYQPEkL271WsfxKnb-frame_0105.webp", "/uploads/yt5Fdfwtah4vP0ZubDZ3e-frame_0106.webp", "/uploads/vqrwfr8Hj3HQek-GDpGnT-frame_0107.webp", "/uploads/XZwUr8ZtDfrXz9-cXUoQZ-frame_0108.webp", "/uploads/g2j5oB6BdixxiMk-ycrJO-frame_0109.webp", "/uploads/9R8_3dgxUHazEnXJTWK6i-frame_0110.webp", "/uploads/TGQB_Ka4bQrchpnxagxQb-frame_0111.webp", "/uploads/4nxxhFdq0gs-N-vEjQB9i-frame_0112.webp", "/uploads/TjSmNwl2VnMeDUxu9IDlv-frame_0113.webp", "/uploads/n_0-fUpr7OMbuSXEGYnws-frame_0114.webp", "/uploads/FyOjcnOE9htV2m40CsJ2_-frame_0115.webp", "/uploads/U-SS5Gshjqz7gwayqTQNH-frame_0116.webp", "/uploads/9oOx5RWGyJx8Lj0rn_glI-frame_0117.webp", "/uploads/uywBPvT4BWC36IuaMwcFW-frame_0118.webp", "/uploads/30xj0Rdm80kOPTfIDvQmj-frame_0119.webp", "/uploads/A8XXmbKN4jvbpup7kJxYP-frame_0120.webp", "/uploads/EfWYgvdCRH9LoDvKGlOpH-frame_0121.webp", "/uploads/t8XiCzUNNwqbSDNFf3ajE-frame_0122.webp", "/uploads/WVTbpRCKgKNTPgPRPBsWV-frame_0123.webp", "/uploads/t57X30g4pxQJHHarwa_3H-frame_0124.webp", "/uploads/Xi03BYMKg78caMvN9Gh9D-frame_0125.webp", "/uploads/xyo-lORAMKIpZnbvpMqD_-frame_0126.webp", "/uploads/mFGgUlUL6HbwJ-TtBAIX3-frame_0127.webp", "/uploads/N3lHR4-BhfUEIggLFKzR6-frame_0128.webp", "/uploads/5jYdMkqxaFQuMT-y6loQ8-frame_0129.webp", "/uploads/mZOLnMcIB1XEQKyMCUjfT-frame_0130.webp", "/uploads/mfKavpoNtYQiOgvRoWcJo-frame_0131.webp", "/uploads/Z5D0721WrEMq1-W3YM4b4-frame_0132.webp", "/uploads/H9VcN0qRpmLXpXtEIhyhw-frame_0133.webp", "/uploads/HBqxTTFj8l1wokOyDQsAT-frame_0134.webp", "/uploads/xMwpnj2fK_IQsLKUrKb0x-frame_0135.webp", "/uploads/5wjUV_T3H4g9-6r_OJzKu-frame_0136.webp", "/uploads/3P1m3d3xWpdEh4uij960k-frame_0137.webp", "/uploads/3u3SdaCW2nyFPBY6vGnCe-frame_0138.webp", "/uploads/OkUQF2qsQtHIlOhsP5x-Y-frame_0139.webp", "/uploads/j9TCSIxLGhkqD4FDyNu31-frame_0140.webp", "/uploads/SxPG3ZzkmB_uaYzTfrXtR-frame_0141.webp", "/uploads/65tiGWux17zV78Gg4tE2l-frame_0142.webp", "/uploads/J1vhJds-_z9IQ5Wi6Xdaa-frame_0143.webp", "/uploads/tNZdE-iXoAYedlZJLjao0-frame_0144.webp", "/uploads/CD7SEh986KE7ZBEfS36O9-frame_0145.webp", "/uploads/_YmxAsbCxIP-fsz8yYxRT-frame_0146.webp", "/uploads/dcnuC6PxZKRwuaM3VQpQr-frame_0147.webp", "/uploads/s3b9fvUuAHS2Jg2Ljb_lt-frame_0148.webp", "/uploads/kx7Xj9hp8pRmqydwIqq07-frame_0149.webp", "/uploads/z97bMi8h3koLh_iLxH02p-frame_0150.webp"];
  var CFG = {
    lines: [
      "Nous avons repens\xE9\nl\u2019externalisation\nautour des \xE9quipes.",
      "Des experts form\xE9s dans la\ndur\xE9e, rendus plus rapides\npar l\u2019IA, deviennent\u2026",
      "l\u2019\xE9quipe qui conna\xEEt\nvraiment votre m\xE9tier."
    ],
    beatPx: 431,
    // scroll per beat — a further -15% speed (longer track) for a slower, more fluid read
    outroPx: 518,
    // frames-only tail after the text is gone → resolves to the grid ending (-15% speed)
    lead: 0.02,
    // small progress lead-in for the text
    smooth: 0.15,
    // progress lerp per 60Hz frame (the page wheel-smoother supplies the heavier glide)
    accent: "#16E6D0",
    // electric teal sweep
    TAIL: 0.18,
    // width (fraction of line) of the teal trailing band
    preloadCapMs: 6e3,
    // hard cap so the preloader never hangs (slow/failed network)
    maxW: 2048,
    // largest sharp bucket on desktop (Instatic variants: 640/1024/1600/2048/2560)
    maxWTouch: 1024,
    // largest sharp bucket on phones/tablets
    loW: 640,
    // preview-tier width
    loStride: 4,
    // preview every Nth frame (~0.9MB for the whole range)
    loPenalty: 2,
    // a preview must be this many frames closer to beat a sharp frame
    fetchConc: 8,
    // parallel frame downloads (HTTP/2)
    bgConc: 3,
    // ...of which the background sweep (frames far from the playhead) may use
    decodeConc: 3,
    // parallel off-thread decodes
    gateStride: 8,
    // AVIF mode: every Nth frame is fetched before the curtain opens
    avifDesktop: ["/uploads/mRCEEUvyv2YQixUTCBdJg-spm-hero-d-001.avif", "/uploads/SYa4u35vQxMwVOeUTLfBS-spm-hero-d-002.avif", "/uploads/PTdpUEz8ab4BnEJUDQPGZ-spm-hero-d-003.avif", "/uploads/6WsSshfCPUmA-VzxHB8BS-spm-hero-d-004.avif", "/uploads/kZUyA5OFv6cFSF0vbn_vl-spm-hero-d-005.avif", "/uploads/pqMFHvGtbPM8RixHsxsya-spm-hero-d-006.avif", "/uploads/JKqTexsrZ_UCyUrMoxlik-spm-hero-d-007.avif", "/uploads/AVar91a66JMzEsq1sHHH9-spm-hero-d-008.avif", "/uploads/yO5dF54aB_blIp6zWPV2t-spm-hero-d-009.avif", "/uploads/x_ku2C-2SKbC8q_frIZtR-spm-hero-d-010.avif", "/uploads/hVjwREJzSkzyAH8BZ8vBU-spm-hero-d-011.avif", "/uploads/zsGPcpRlA5eXOHNhTM85l-spm-hero-d-012.avif", "/uploads/FVDN5GJIxBvR8tlSNWe4n-spm-hero-d-013.avif", "/uploads/x2pLKtJKcDuDULI3wwiIO-spm-hero-d-014.avif", "/uploads/Zlo3BqA9xtXbOLQVB5ZNB-spm-hero-d-015.avif", "/uploads/SKoGkncc3x5twFGPpgsOj-spm-hero-d-016.avif", "/uploads/mOqQOGZfgHcCmwzD3SlvO-spm-hero-d-017.avif", "/uploads/IVSHUhCOdC83qBD2RIc68-spm-hero-d-018.avif", "/uploads/E1LE6ke817FPsb_ihv6v0-spm-hero-d-019.avif", "/uploads/J4dx54Zixl-yGpNwWl15m-spm-hero-d-020.avif", "/uploads/Bs5IDvu55secUqGAWI-dt-spm-hero-d-021.avif", "/uploads/4tw8mF2tuf2icwsqUM_LR-spm-hero-d-022.avif", "/uploads/7fWRLFIeFII-mArRjqWbd-spm-hero-d-023.avif", "/uploads/tFVDnBnFGCi1m4Uz6KIdz-spm-hero-d-024.avif", "/uploads/KHPwGgeruU9LrKziZ08ye-spm-hero-d-025.avif", "/uploads/tTbbhSl90ebJyocMZNUCS-spm-hero-d-026.avif", "/uploads/Wd3EIIZQAy74Z3-hqWDhc-spm-hero-d-027.avif", "/uploads/KxUHjWuWpD6nSpx9I49yf-spm-hero-d-028.avif", "/uploads/azKcx6aKkGxDcN7Ff_Qr9-spm-hero-d-029.avif", "/uploads/MtEZg9SnoDP2041QWC0SP-spm-hero-d-030.avif", "/uploads/4goHRnhrxST87748_84OT-spm-hero-d-031.avif", "/uploads/jpJ8Ci0-c8xLcuVSRMYIK-spm-hero-d-032.avif", "/uploads/f6W5bygxGNdCJLCyuS9ix-spm-hero-d-033.avif", "/uploads/kP5JxUNMjWEBls5Z0vI9z-spm-hero-d-034.avif", "/uploads/Y3FPL7d4Q_sK0GsrzYmdp-spm-hero-d-035.avif", "/uploads/G19EvgqCRkXcYKLAP-kMI-spm-hero-d-036.avif", "/uploads/d-7uIv0iKSfdDf2zO_BdS-spm-hero-d-037.avif", "/uploads/W5xNUyWTU4tzLy6Ch1w7m-spm-hero-d-038.avif", "/uploads/xXdOrQUAhGHdanfjzsTII-spm-hero-d-039.avif", "/uploads/bPn5woK0qeWgQCRLaEntp-spm-hero-d-040.avif", "/uploads/W90h8grLwsccEswQx0PxT-spm-hero-d-041.avif", "/uploads/ANnCDsVul2ZXZC6UQt-CE-spm-hero-d-042.avif", "/uploads/thY3_WV-gXwP3nvSKFDQW-spm-hero-d-043.avif", "/uploads/1DTuVebjyDuHyLAuJ6IFv-spm-hero-d-044.avif", "/uploads/U0uvRppsryevotHZ7402D-spm-hero-d-045.avif", "/uploads/rRDjBO0MAAn8CKnZeYIrt-spm-hero-d-046.avif", "/uploads/ky5LXgL7lTrVYH9an0oS1-spm-hero-d-047.avif", "/uploads/1wiGTSgKEywBmXsu9xTLe-spm-hero-d-048.avif", "/uploads/r5Mgn1J7_HezSzhbnsuxz-spm-hero-d-049.avif", "/uploads/f4Up-7DkJb9eys0ljSjVk-spm-hero-d-050.avif", "/uploads/o6rQH23HZSNsy1AzKfVMJ-spm-hero-d-051.avif", "/uploads/uqcBe7q8sx4fb_d7siwjL-spm-hero-d-052.avif", "/uploads/JkN49XB7oz_p-fTWpgffh-spm-hero-d-053.avif", "/uploads/LkyTRXjMGFNs4jTQ4n8X0-spm-hero-d-054.avif", "/uploads/Cwog8GsE7rpi8FLbmfyww-spm-hero-d-055.avif", "/uploads/vkSy9DPQ1l1caCRbxk0p0-spm-hero-d-056.avif", "/uploads/UAOmXcMuV7Xy6J3hgbGT0-spm-hero-d-057.avif", "/uploads/__DI7oFkUxeV-1RhwZpIy-spm-hero-d-058.avif", "/uploads/pYKt83qE-oylPXrENSchU-spm-hero-d-059.avif", "/uploads/vmBhuJFJTiLjLMXNDLxCV-spm-hero-d-060.avif", "/uploads/raclbGoItDWPQaZ-ZY3ri-spm-hero-d-061.avif", "/uploads/AXUWOT6MQ-jUWpIML9wH--spm-hero-d-062.avif", "/uploads/V7OGtp1onPwj2qhkMCvE2-spm-hero-d-063.avif", "/uploads/7zqepbdHLZ5DnMoVwaiaB-spm-hero-d-064.avif", "/uploads/o3v4QzxBN27Vm1jwEjTY6-spm-hero-d-065.avif", "/uploads/CwbDZommjZXbTKxgC5lvb-spm-hero-d-066.avif", "/uploads/aXRjRpz4w5RLZoitqdrfN-spm-hero-d-067.avif", "/uploads/rhwVr4YHScpZ1ETRq74vq-spm-hero-d-068.avif", "/uploads/_Tfg2sXlEgW74vMSCneZ_-spm-hero-d-069.avif", "/uploads/852XNCw6wAAQb4t6K3LPV-spm-hero-d-070.avif", "/uploads/Fg00G7uoos2N260qtZIPv-spm-hero-d-071.avif", "/uploads/CzhzzF_kfjVS0ghAEoWiM-spm-hero-d-072.avif", "/uploads/Q-6JlJiM4TkV8da7qEB_J-spm-hero-d-073.avif", "/uploads/fn3_TkxxdMVUkDC4llBp0-spm-hero-d-074.avif", "/uploads/Oeg5hchbP-vJVGoC207ja-spm-hero-d-075.avif", "/uploads/y7SIGe74egS3kFbERqEWz-spm-hero-d-076.avif", "/uploads/jMmRfMWCznswCcO368HAO-spm-hero-d-077.avif", "/uploads/rIspCALSUKKHu1bZe_PZA-spm-hero-d-078.avif", "/uploads/tTcLqbCh3gMlmzRH27cj3-spm-hero-d-079.avif", "/uploads/D-7iv3h4QjISDXE2XwjxY-spm-hero-d-080.avif", "/uploads/ULz09zmQu52dkis9BV0lt-spm-hero-d-081.avif", "/uploads/ljfPyGHb2pxsToBculEDx-spm-hero-d-082.avif", "/uploads/d7KjFccbnDbBjlx2p-dAB-spm-hero-d-083.avif", "/uploads/VPJM2T7VRWVtQhPBT5mpw-spm-hero-d-084.avif", "/uploads/hDExMh9Y7f-6KX9kDdV4h-spm-hero-d-085.avif", "/uploads/TnaQJVCmwZpopcxIo-kFM-spm-hero-d-086.avif", "/uploads/bXuPrpRfs8fPjkFuqaX-F-spm-hero-d-087.avif", "/uploads/s_YULIYk95r18oSQP1qaH-spm-hero-d-088.avif", "/uploads/RPJdCrk40wvk5_WWKKqty-spm-hero-d-089.avif", "/uploads/sKHhib_THiQ_idxdSreMy-spm-hero-d-090.avif", "/uploads/ekNMcGzV4v0U9AZeuvd-M-spm-hero-d-091.avif", "/uploads/DG1hcONpx7tVFzf5SHUv8-spm-hero-d-092.avif", "/uploads/-2ZJ0KlDEiPpMEO7wFxiQ-spm-hero-d-093.avif", "/uploads/uLqXGKGb7WysfPc_n2KcM-spm-hero-d-094.avif", "/uploads/kNdmgLVz0q6D21ZvTjHXr-spm-hero-d-095.avif", "/uploads/2vn0ljaAIyLNPGv5zY26h-spm-hero-d-096.avif", "/uploads/0TfyaDxkmm-03o3XB3OjO-spm-hero-d-097.avif", "/uploads/_TijeoT5JopH_eQNF1ljD-spm-hero-d-098.avif", "/uploads/uqyPYyXPLCnnIt3UIXYuL-spm-hero-d-099.avif", "/uploads/37rOhwI_cQ2r_1iuaIVh0-spm-hero-d-100.avif", "/uploads/LpY6rX6rMPKy5LghXtL9O-spm-hero-d-101.avif", "/uploads/OtdnkjafJaB0uLvX9dlOS-spm-hero-d-102.avif", "/uploads/NWalLbsr6jOEQuPxUfnGE-spm-hero-d-103.avif", "/uploads/lL-FfIfbD0Hcfy1vGbURf-spm-hero-d-104.avif", "/uploads/bF-p4AikX9sZ_vUgncxNw-spm-hero-d-105.avif", "/uploads/0NYcvpW0Rh0eQNsgjpZQZ-spm-hero-d-106.avif", "/uploads/No8FajMGu0Zv8hpqNMih7-spm-hero-d-107.avif", "/uploads/lozH8L0gJe2IWHBKCPedB-spm-hero-d-108.avif", "/uploads/7bV-rvkq1PfnNhYLksgRg-spm-hero-d-109.avif", "/uploads/Oym83rJZa6YpHSSPSEXOc-spm-hero-d-110.avif", "/uploads/PQ-DvKkmt8a8NCCjJrtVU-spm-hero-d-111.avif", "/uploads/5ZntiylGwpUARFKrAptEF-spm-hero-d-112.avif", "/uploads/TdCG8jdqwD56VmQkrksT5-spm-hero-d-113.avif", "/uploads/xBuCcXpoPgVScB9EyQTeq-spm-hero-d-114.avif", "/uploads/BELt79FXyPWFpwMIdAX-i-spm-hero-d-115.avif", "/uploads/YDYBnWf06McrHkLu_EhkK-spm-hero-d-116.avif", "/uploads/gc5OTT94z7EukxheBr0V7-spm-hero-d-117.avif", "/uploads/MaBrgLWH1axF2m4AEPBS9-spm-hero-d-118.avif", "/uploads/3NKMOdbNVPzNTEIYOVb0E-spm-hero-d-119.avif", "/uploads/i50gGDqRmVsF3uTEnh1dC-spm-hero-d-120.avif", "/uploads/V6c0JEIkTQ-Rrz7uZPpnq-spm-hero-d-121.avif", "/uploads/_Om3OOiMzR03rsdRsHc24-spm-hero-d-122.avif", "/uploads/42MVNvh4kQd7K0SZFLGEQ-spm-hero-d-123.avif", "/uploads/b4ddOZZcFOsRzn74uxlc5-spm-hero-d-124.avif", "/uploads/OPxkZ-ldQNNd7cbNniEFb-spm-hero-d-125.avif", "/uploads/l55XXZmJzvtGHWgjxYjmF-spm-hero-d-126.avif", "/uploads/CnGMarmItbhqcCY5AZ19q-spm-hero-d-127.avif", "/uploads/fT7MzbsNHCpn30WPi6w9e-spm-hero-d-128.avif", "/uploads/PguXqtiM7OXvKTyREnoaX-spm-hero-d-129.avif", "/uploads/J___LFBx04fjZifSRc55K-spm-hero-d-130.avif", "/uploads/OT1okC3WG5e1wkfjjdJQJ-spm-hero-d-131.avif", "/uploads/pQY4rcAAPJzw7jHY5iMDw-spm-hero-d-132.avif", "/uploads/XZEdVFjyF7lv3orPTuldZ-spm-hero-d-133.avif", "/uploads/7mv2A1GBLGXbyuFy0_9lg-spm-hero-d-134.avif", "/uploads/ZhCuq82ba5cfN5BFCaVDS-spm-hero-d-135.avif", "/uploads/6CsQDTqp_sKtOCwrYOBA6-spm-hero-d-136.avif", "/uploads/HaFbXz1s0W-TTt6yY6j-J-spm-hero-d-137.avif", "/uploads/P-HQSX4GiUEx6W8Ce2vz2-spm-hero-d-138.avif", "/uploads/Qt7K4soK8cOwslpjeFSQI-spm-hero-d-139.avif", "/uploads/Fk2mZOJWr1EvCUzY65gpJ-spm-hero-d-140.avif", "/uploads/zyeO6Zd_4h6aIm1vPVmty-spm-hero-d-141.avif", "/uploads/q3xp5F5iRu8dI28DE70XR-spm-hero-d-142.avif", "/uploads/Kx-KylewsE_lkY2S_DQcm-spm-hero-d-143.avif", "/uploads/WodwEWyp2OTY-j0h_pBfK-spm-hero-d-144.avif", "/uploads/Rb3j9ENeVkQvIsizIT4ft-spm-hero-d-145.avif", "/uploads/z9XQGyPn6Ib9lxj2xH8UI-spm-hero-d-146.avif", "/uploads/4jzI06UaFucU2aEnIW-UC-spm-hero-d-147.avif", "/uploads/euwP_K-Et_VPel_VCBVKh-spm-hero-d-148.avif", "/uploads/U5tjatjYwaAMiYqrakAYs-spm-hero-d-149.avif", "/uploads/4F7BxxmjLEx3yDd5tZV6O-spm-hero-d-150.avif"],
    avifPhone: ["/uploads/_mAQaVcE2yDtXLezrjoaZ-spm-hero-m-001.avif", "/uploads/37tab38oz7HFVqJ5WQDRE-spm-hero-m-002.avif", "/uploads/atHhGhChtw5ENwL11GwYy-spm-hero-m-003.avif", "/uploads/xFyAwhMr7i2e1rx6EzssU-spm-hero-m-004.avif", "/uploads/mzdgCuOocqMBgKFoPbDa4-spm-hero-m-005.avif", "/uploads/zkdsZCwFUI2UoIy1xtyYZ-spm-hero-m-006.avif", "/uploads/FVVE9VgGD_ikyoZz2WOuv-spm-hero-m-007.avif", "/uploads/8wCMLVCxeaxh-ntb7Wd-n-spm-hero-m-008.avif", "/uploads/b8-MAVTCjIeZgmmB7r7n_-spm-hero-m-009.avif", "/uploads/Pg6qSG3tGg94bXSPamRKr-spm-hero-m-010.avif", "/uploads/7i4fUn1OAw93gjd2wvD7j-spm-hero-m-011.avif", "/uploads/DN3mp84Fr7PKMaB_Jt0dh-spm-hero-m-012.avif", "/uploads/k2FXdWYwZDLmSAj5LLIRA-spm-hero-m-013.avif", "/uploads/yumjECz-0Q7dXJi0DzNeo-spm-hero-m-014.avif", "/uploads/Kr8CQIDrBGFTbtbjwT2Qr-spm-hero-m-015.avif", "/uploads/o48e7bgziXVo0YM2dCsg0-spm-hero-m-016.avif", "/uploads/eeDCSD-fOOKTGwKwFynMi-spm-hero-m-017.avif", "/uploads/8jkvjmOBdGs1ccZT5AWBt-spm-hero-m-018.avif", "/uploads/sNsjmlg0Kcd-EOjwEeeLp-spm-hero-m-019.avif", "/uploads/HRvEe5rnlZ_UIaIMjF7Hw-spm-hero-m-020.avif", "/uploads/I5Tk7kYG8yEszgOqmR3uX-spm-hero-m-021.avif", "/uploads/-67S9a5z11Jx6qEx6vddb-spm-hero-m-022.avif", "/uploads/ZEX8m2cSjgonf0afuxbmk-spm-hero-m-023.avif", "/uploads/T2X-Bpo4GUX_J79lgzNsO-spm-hero-m-024.avif", "/uploads/3LdX0Q_7uSy3t0nqUj80C-spm-hero-m-025.avif", "/uploads/GbTp5cZxBJiNdgdytAfLn-spm-hero-m-026.avif", "/uploads/9-Xlk_6nATbCaNKHkGXty-spm-hero-m-027.avif", "/uploads/JBQwbrkPoXMo6B1d-7hSg-spm-hero-m-028.avif", "/uploads/fRTGUa_XlSOsfXOGpPNuv-spm-hero-m-029.avif", "/uploads/VDkN8rahfFsojRP3N6UhS-spm-hero-m-030.avif", "/uploads/7_nUTqweiA2xVUG6VMpgF-spm-hero-m-031.avif", "/uploads/u-Lu3LL8q6wYpMMLxcXNn-spm-hero-m-032.avif", "/uploads/ARs2dfi2ngAlmhaD722Nc-spm-hero-m-033.avif", "/uploads/qSRjs2pKWBHv4E-5QCsyJ-spm-hero-m-034.avif", "/uploads/O4iWYhbzlq-Gzs_Y_SD9r-spm-hero-m-035.avif", "/uploads/c8MdiGhxFKwhpsRA1vdWA-spm-hero-m-036.avif", "/uploads/ZuqhDcG2myp1RXCiKkthc-spm-hero-m-037.avif", "/uploads/deD8v9cXoGL2DCAGp5cWf-spm-hero-m-038.avif", "/uploads/lNCsVmvTmaZUpFyYSUvzE-spm-hero-m-039.avif", "/uploads/iDp-ZzGVGe8XECd1MD4Es-spm-hero-m-040.avif", "/uploads/Qc3eAba5a4Pds8dHdDWhl-spm-hero-m-041.avif", "/uploads/kIQqkmX0hkNfoCY8YEAqt-spm-hero-m-042.avif", "/uploads/Ey1tQtCELJNfYhnMSEEUv-spm-hero-m-043.avif", "/uploads/K6vlAiQqfxY1KQw103rhi-spm-hero-m-044.avif", "/uploads/nfbRlXSHcWGGyocFH0-M7-spm-hero-m-045.avif", "/uploads/p9YeBtmaIMkGStRmSa2v6-spm-hero-m-046.avif", "/uploads/M0uUZDH7CHq4eJ0-XobHt-spm-hero-m-047.avif", "/uploads/bwhElqJIbf1OfD9aJqnn8-spm-hero-m-048.avif", "/uploads/yiCXoiylcg0cMqr-9DHIt-spm-hero-m-049.avif", "/uploads/DWvXO4h5bpN97ZwqlNO6v-spm-hero-m-050.avif", "/uploads/UNcRV-JWD49JJhpn6v5j8-spm-hero-m-051.avif", "/uploads/zL2A3Q32AuaAAPxnwi23X-spm-hero-m-052.avif", "/uploads/jMUsUxEAsDHPSJoScKAKY-spm-hero-m-053.avif", "/uploads/f3YYE31wf5E9NU3Rrk31Q-spm-hero-m-054.avif", "/uploads/x--J6y-bwfWHaNx5Rm9o_-spm-hero-m-055.avif", "/uploads/Vq3USjwMVXMOpcGNSjSM0-spm-hero-m-056.avif", "/uploads/1CMVP0GoaQ7_vtQfCu0mg-spm-hero-m-057.avif", "/uploads/JYlHOZEO6mJeCkLiPWGNw-spm-hero-m-058.avif", "/uploads/_k8Y7CpvvATWbEHP4tOi7-spm-hero-m-059.avif", "/uploads/0LkyNgV1S3pdBiZ2bHdwL-spm-hero-m-060.avif", "/uploads/vgu30si4Kyo7FcjZju67S-spm-hero-m-061.avif", "/uploads/i_8OasNvcv4jNnEnbKpXN-spm-hero-m-062.avif", "/uploads/5APL-ZOOfkBXkA1EiJ-YR-spm-hero-m-063.avif", "/uploads/hEepKr1IciKUEEat4MuJN-spm-hero-m-064.avif", "/uploads/FaWafbA4I9PKcMl0iZUMk-spm-hero-m-065.avif", "/uploads/9KP-pe4uyy5wGBynG4zbq-spm-hero-m-066.avif", "/uploads/sLpDVSEPR0ZftkoO3cxTG-spm-hero-m-067.avif", "/uploads/fV6n9B0vc2AI7WF2swzVH-spm-hero-m-068.avif", "/uploads/K_2Pyg0AAiABCBakOY_Hu-spm-hero-m-069.avif", "/uploads/UQxVjhud5rIKDFkKCDLP1-spm-hero-m-070.avif", "/uploads/FxCMVP7rBWksCQ9kbkuc2-spm-hero-m-071.avif", "/uploads/gqZBS9qQcJcW4OfxkGXR8-spm-hero-m-072.avif", "/uploads/tLXPDnmrix1SAdgmWV0C5-spm-hero-m-073.avif", "/uploads/ANUZTSIcWWWsnAzwVCOf9-spm-hero-m-074.avif", "/uploads/AEGM1JDsFc4lPKQShLO7z-spm-hero-m-075.avif", "/uploads/6rRqmR85OMXetvEE403gk-spm-hero-m-076.avif", "/uploads/d7P1b34Mg109V9QXA9lkE-spm-hero-m-077.avif", "/uploads/Hb8oey5kiRNfXw9uuDGUp-spm-hero-m-078.avif", "/uploads/1Pou482kpBSXV47tZeccz-spm-hero-m-079.avif", "/uploads/XUo5ZHmU5zG1FyutMb_wB-spm-hero-m-080.avif", "/uploads/FVzu5ExKvWww_why5bsK7-spm-hero-m-081.avif", "/uploads/l7cIVFuJ3-hmzKfDexABB-spm-hero-m-082.avif", "/uploads/8_0HbTMLPeYy7YkCNPgPB-spm-hero-m-083.avif", "/uploads/ymzCvRBzisDiNee-YAysb-spm-hero-m-084.avif", "/uploads/gh_MU601pI_JRXFxp6I-5-spm-hero-m-085.avif", "/uploads/1sx0qTVH8HpBoll_pIwV_-spm-hero-m-086.avif", "/uploads/o7yw5cS_xBlViwLERYrTK-spm-hero-m-087.avif", "/uploads/3IfMTXNYivOb2-o8mHobk-spm-hero-m-088.avif", "/uploads/JUYwxFOKIJdYYXoFLimP9-spm-hero-m-089.avif", "/uploads/uq88PSh0Jw136bcuk_kzU-spm-hero-m-090.avif", "/uploads/YioVanXKQlK6OUsXs-6e--spm-hero-m-091.avif", "/uploads/OE_NxPpP-2SJ1UhYWftX6-spm-hero-m-092.avif", "/uploads/hywmRVLXCqZJ_7yCJK0fB-spm-hero-m-093.avif", "/uploads/AopRiG5A3v2z_WAd_gbFh-spm-hero-m-094.avif", "/uploads/Q6PbnOtvraY8DSS7q6diK-spm-hero-m-095.avif", "/uploads/CsS0nuVuDwQo_x5CFrbCC-spm-hero-m-096.avif", "/uploads/QlFuRIwol2ld3Y7o99Wmc-spm-hero-m-097.avif", "/uploads/7SKYrZyFaHxyaVF7DQ3UB-spm-hero-m-098.avif", "/uploads/SzeWB18vMOMrdmAiAK03a-spm-hero-m-099.avif", "/uploads/JmZ2hJy7VinVwHzXKbxvc-spm-hero-m-100.avif", "/uploads/iKFG9PnplKzuPq8kF5FOj-spm-hero-m-101.avif", "/uploads/HcgiJyZLxNjU_yJ-noO_F-spm-hero-m-102.avif", "/uploads/FEOCvhrJ4bMmyAPVS6Cn9-spm-hero-m-103.avif", "/uploads/Mj-SEFFlNxRdjevojaU-W-spm-hero-m-104.avif", "/uploads/9dzaGt0zJgUM8oKo7zGhO-spm-hero-m-105.avif", "/uploads/KV-hMt_KqhT1VP9jBnoO6-spm-hero-m-106.avif", "/uploads/SQ1lzcu8Y0kJXZbDxi7dJ-spm-hero-m-107.avif", "/uploads/R4Sr3A1bbsCPDFr28ZwZv-spm-hero-m-108.avif", "/uploads/b2ZA0ad-yecBkHMrSUV62-spm-hero-m-109.avif", "/uploads/q1LNXtvLEIMv8ldl3tbkv-spm-hero-m-110.avif", "/uploads/5VdEZkgIV9SoOF9YsYycC-spm-hero-m-111.avif", "/uploads/GL5plcNuIwGOb9zf5Eyu0-spm-hero-m-112.avif", "/uploads/-htLFAfMn6ugXCB5Iyx4e-spm-hero-m-113.avif", "/uploads/M18KPf55dKxE--hgYEWGS-spm-hero-m-114.avif", "/uploads/rGQURQVp5LVXnvGX3J7o0-spm-hero-m-115.avif", "/uploads/QXDSmzXUfv4MTPgPmSemb-spm-hero-m-116.avif", "/uploads/TdcxhzDlRs5QEyS94ei1P-spm-hero-m-117.avif", "/uploads/lCeK6Lz0sxSu_dkEEsfpq-spm-hero-m-118.avif", "/uploads/VPXufrjd6FAk0qGa64-Pv-spm-hero-m-119.avif", "/uploads/NMgxDg5aSPJYmYWsoTVcV-spm-hero-m-120.avif", "/uploads/a5hRskzkSPe2psgRm-FU9-spm-hero-m-121.avif", "/uploads/fBE9BlaY7-mHy-CNxUqT3-spm-hero-m-122.avif", "/uploads/nYs5psY_WRKo6ZLXVqcDf-spm-hero-m-123.avif", "/uploads/3iUkZj6erLhTn_ZETS-NO-spm-hero-m-124.avif", "/uploads/4ngc6X9sBfVPt0pJQQRKP-spm-hero-m-125.avif", "/uploads/WUSrae-pbF-SQ3FyRWTA--spm-hero-m-126.avif", "/uploads/n3AP9ju8PsnKbpM5ffOL9-spm-hero-m-127.avif", "/uploads/IY27DfW6bJPr3pjObux_6-spm-hero-m-128.avif", "/uploads/E3tvUW8gOgoXnI9nHjGVC-spm-hero-m-129.avif", "/uploads/y7oFsKQqdNpL-n9n5Q3fB-spm-hero-m-130.avif", "/uploads/dtDIP4oO8Tf6M3lGiA7pc-spm-hero-m-131.avif", "/uploads/JVD9q01sSO9wB7G2XL-qG-spm-hero-m-132.avif", "/uploads/p_AFfkQo4zTaEpgc6D6aP-spm-hero-m-133.avif", "/uploads/dZ4ihT_Rf2un28sZ0ywhc-spm-hero-m-134.avif", "/uploads/qjL1XOhBlJ9uKMJ1qhqpE-spm-hero-m-135.avif", "/uploads/QeNzojTzmN6l5qoj9AdAJ-spm-hero-m-136.avif", "/uploads/dRm_oIcwZziqrrVlP2xs5-spm-hero-m-137.avif", "/uploads/3sg6Yso0Hvm58LKbBE7_r-spm-hero-m-138.avif", "/uploads/BO_0Vwmj893mFI5nQn0RQ-spm-hero-m-139.avif", "/uploads/YISiVpFLEt8CX7MAAxJWT-spm-hero-m-140.avif", "/uploads/jxLAOAt9H1ov0yU5yi8Nr-spm-hero-m-141.avif", "/uploads/I1SofBQlE9MA4dNikdKS7-spm-hero-m-142.avif", "/uploads/cr4Pw73dUgM5rgtQsEXv5-spm-hero-m-143.avif", "/uploads/P7-jx31gPSdM_biT7VbQt-spm-hero-m-144.avif", "/uploads/35CCiA__Yn1X9jrMMd-bl-spm-hero-m-145.avif", "/uploads/oHw56QJMO6dkBLbrmNDRW-spm-hero-m-146.avif", "/uploads/vVFYG3k6d9u_TWaS8edsP-spm-hero-m-147.avif", "/uploads/eoCjZdFXHfbZwDJKMEeBX-spm-hero-m-148.avif", "/uploads/m0KCepKpySdQEKdboSohG-spm-hero-m-149.avif", "/uploads/2a58103fl6GWwQQKuWUG1-spm-hero-m-150.avif"],
    // portrait set; empty → phones use the desktop set
    logo: "data:image/webp;base64,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"
  };
  var wrap = document.querySelector(".v3f-hero");
  var stage = document.querySelector(".v3f-hero-stage");
  var canvas = document.querySelector(".v3f-hero-canvas");
  var copy = document.querySelector(".v3f-hero-copy");
  var hint = document.querySelector(".v3f-scroll-hint");
  if (!wrap || !stage || !canvas || !copy || !FRAMES.length) return;
  var ctx = canvas.getContext("2d", { alpha: false });
  var lerp = function(a, b, t) {
    return a + (b - a) * t;
  };
  var clamp = function(v, a, b) {
    return v < a ? a : v > b ? b : v;
  };
  function hx(h) {
    h = h.replace("#", "");
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  var ACC = hx(CFG.accent);
  function pow2out(x) {
    return 1 - (1 - x) * (1 - x);
  }
  function pow2in(x) {
    return x * x;
  }
  function tealMix(a) {
    return "rgb(" + Math.round(lerp(255, ACC[0], a)) + "," + Math.round(lerp(255, ACC[1], a)) + "," + Math.round(lerp(255, ACC[2], a)) + ")";
  }
  var coarse = matchMedia("(pointer: coarse)").matches;
  var conn = navigator.connection || {};
  var slowNet = !!conn.saveData || /(^|-)(2g|3g)$/.test(conn.effectiveType || "");
  var AVIF_PROBE = "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAAD5bWV0YQAAAAAAAAAvaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAFBpY3R1cmVIYW5kbGVyAAAAAA5waXRtAAAAAAABAAAAHmlsb2MAAAAARAAAAQABAAAAAQAAASEAAAAWAAAAKGlpbmYAAAAAAAEAAAAaaW5mZQIAAAAAAQAAYXYwMUNvbG9yAAAAAGppcHJwAAAAS2lwY28AAAAUaXNwZQAAAAAAAAACAAAAAgAAABBwaXhpAAAAAAMICAgAAAAMYXYxQ4EADAAAAAATY29scm5jbHgAAgACAAIAAAAAF2lwbWEAAAAAAAAAAQABBAECgwQAAAAebWRhdAoFGAA2wCAyDRyAAABYAAAAAK5xncA=";
  function detectAvif(cb) {
    var im = new Image(), done = false;
    function fin(ok) {
      if (!done) {
        done = true;
        cb(ok);
      }
    }
    im.onload = function() {
      fin(im.width > 0);
    };
    im.onerror = function() {
      fin(false);
    };
    setTimeout(function() {
      fin(false);
    }, 1500);
    im.src = AVIF_PROBE;
  }
  function thin(list) {
    if (!slowNet) return list.slice();
    var half = [];
    for (var i = 0; i < list.length; i += 2) half.push(list[i]);
    if (half[half.length - 1] !== list[list.length - 1]) half.push(list[list.length - 1]);
    return half;
  }
  var LEGACY = thin(FRAMES);
  var N = LEGACY.length;
  function variant(w) {
    return LEGACY.map(function(u) {
      return u.slice(0, -5) + "-w" + w + ".webp";
    });
  }
  var FRAMES_BASE, FW = 1600, FA = 16 / 9, LOW_IDX = [], GATE = [], FIRST = [], CAP = 8, avifMode = false;
  function chooseFrames(avifOK) {
    var cw0 = stage.clientWidth || window.innerWidth, ch0 = stage.clientHeight || window.innerHeight;
    avifMode = avifOK && CFG.avifDesktop.length === FRAMES.length;
    if (avifMode) {
      var phone = CFG.avifPhone.length === FRAMES.length && cw0 / ch0 < 0.8;
      FRAMES = thin(phone ? CFG.avifPhone : CFG.avifDesktop);
      FW = phone ? 720 : 1920;
      FA = phone ? 9 / 16 : 16 / 9;
      FRAMES_BASE = variant(1600);
      var seen = new Uint8Array(N);
      for (var g = 0; g < N; g += CFG.gateStride) {
        GATE.push(g);
        seen[g] = 1;
      }
      if (!seen[N - 1]) {
        GATE.push(N - 1);
        seen[N - 1] = 1;
      }
      FIRST = GATE.slice();
      for (var f = 0; f < N; f += 4) if (!seen[f]) FIRST.push(f);
    } else {
      var maxW = coarse ? CFG.maxWTouch : CFG.maxW;
      if (slowNet) maxW = coarse ? 640 : 1024;
      var AVAIL = [640, 1024, 1600, 2048].filter(function(w) {
        return w <= maxW;
      });
      var need = Math.max(cw0, ch0 * 16 / 9) * 0.8;
      FW = AVAIL[AVAIL.length - 1];
      for (var i = 0; i < AVAIL.length; i++) {
        if (AVAIL[i] >= need) {
          FW = AVAIL[i];
          break;
        }
      }
      FRAMES = variant(FW);
      FRAMES_BASE = LEGACY;
      if (FW > CFG.loW) {
        for (var li0 = 0; li0 < N; li0 += CFG.loStride) LOW_IDX.push(li0);
        if (LOW_IDX[LOW_IDX.length - 1] !== N - 1) LOW_IDX.push(N - 1);
      }
    }
    var dm = navigator.deviceMemory || 8;
    var mb = coarse ? dm >= 4 ? 128 : 80 : dm >= 8 ? 320 : dm >= 4 ? 200 : 120;
    CAP = clamp(Math.floor(mb * 1048576 / (FW * Math.round(FW / FA) * 4)), 8, N);
  }
  var beats = CFG.lines.map(function(text) {
    var el = document.createElement("div");
    el.className = "v3f-beat";
    var chars = [];
    text.split("\n").forEach(function(sub, si, subs) {
      var words = sub.split(" ");
      words.forEach(function(w, wi) {
        var wordEl = document.createElement("span");
        wordEl.className = "v3f-word";
        for (var i = 0; i < w.length; i++) {
          var c = document.createElement("span");
          c.className = "v3f-ch";
          c.textContent = w[i];
          wordEl.appendChild(c);
          chars.push(c);
        }
        el.appendChild(wordEl);
        if (wi < words.length - 1) {
          var sp = document.createElement("span");
          sp.className = "v3f-sp";
          sp.innerHTML = "&nbsp;";
          el.appendChild(sp);
          chars.push(sp);
        }
      });
      if (si < subs.length - 1) el.appendChild(document.createElement("br"));
    });
    copy.appendChild(el);
    return { el, chars, n: chars.length, o: [], c: [], shown: false, cleared: false };
  });
  function extraPx() {
    return CFG.beatPx * beats.length + CFG.outroPx;
  }
  var cw = 0, ch = 0, trackH = 0;
  function layout() {
    var sh = stage.clientHeight || window.innerHeight;
    var h = sh + extraPx();
    if (h !== trackH) {
      trackH = h;
      wrap.style.height = h + "px";
    }
    sizeCanvas();
  }
  function sizeCanvas() {
    var w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    var cover = Math.max(w, h * FA);
    var dpr = Math.min(window.devicePixelRatio || 1, 2, Math.max(1, FW / cover));
    var bw = Math.max(1, Math.round(w * dpr)), bh = Math.max(1, Math.round(h * dpr));
    cw = w;
    ch = h;
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      drawnKey = -1;
    }
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    kick();
  }
  var hasCIB = typeof window.createImageBitmap === "function";
  function mkTier(urls) {
    return { url: urls, src: urls.slice(), st: new Uint8Array(N), blob: new Array(N), bmp: new Array(N), dec: new Uint8Array(N) };
  }
  var HI = null, LO = null;
  var loDone = 0;
  var gateDone = 0, isGate = null;
  var inFlight = 0, decInFlight = 0, hiDecInFlight = 0, bmpCount = 0;
  var reqIdx = 0, drawnKey = -1, dir = 1;
  var framesReady = false;
  var order = [], loOrder = [], orderPos = 0, loPos = 0, firstPos = 0;
  function setupPipeline() {
    HI = mkTier(FRAMES);
    LO = mkTier(LOW_IDX.length ? variant(CFG.loW) : FRAMES);
    isGate = new Uint8Array(N);
    GATE.forEach(function(g) {
      isGate[g] = 1;
    });
    var seen = new Uint8Array(N);
    [16, 8, 4, 2, 1].forEach(function(s, lvl) {
      for (var i = 0; i < N; i += s) if (!seen[i]) {
        seen[i] = 1;
        order.push(i);
      }
      if (lvl === 0 && !seen[N - 1]) {
        seen[N - 1] = 1;
        order.push(N - 1);
      }
    });
    loOrder = LOW_IDX.filter(function(i, k) {
      return k % 2 === 0;
    }).concat(LOW_IDX.filter(function(i, k) {
      return k % 2 === 1;
    }));
  }
  function nextToFetch() {
    if (!HI.st[0]) return [HI, 0];
    while (loPos < loOrder.length && LO.st[loOrder[loPos]]) loPos++;
    if (loPos < loOrder.length) return [LO, loOrder[loPos]];
    while (firstPos < FIRST.length && HI.st[FIRST[firstPos]]) firstPos++;
    if (firstPos < FIRST.length) {
      if (firstPos >= GATE.length && !framesReady) return null;
      return [HI, FIRST[firstPos]];
    }
    for (var d = 0; d <= 16; d++) {
      var a = reqIdx + dir * d;
      if (a >= 0 && a < N && !HI.st[a]) return [HI, a];
      if (d <= 3) {
        var b = reqIdx - dir * d;
        if (b >= 0 && b < N && !HI.st[b]) return [HI, b];
      }
    }
    if (inFlight >= CFG.bgConc) return null;
    while (orderPos < order.length && HI.st[order[orderPos]]) orderPos++;
    return orderPos < order.length ? [HI, order[orderPos], 1] : null;
  }
  function pump() {
    while (inFlight < CFG.fetchConc) {
      var n = nextToFetch();
      if (!n) return;
      fetchFrame(n[0], n[1], false, n[2]);
    }
  }
  function fetchFrame(T, i, retry, bg) {
    T.st[i] = 1;
    inFlight++;
    var url = retry ? FRAMES_BASE[i] : T.url[i];
    var ctl = typeof AbortController === "function" ? new AbortController() : null;
    var tmr = setTimeout(function() {
      if (ctl) ctl.abort();
    }, 15e3);
    var opts = { credentials: "same-origin" };
    if (ctl) opts.signal = ctl.signal;
    if (i === 0 || T === LO || T === HI && isGate[i]) opts.priority = "high";
    else if (bg) opts.priority = "low";
    fetch(url, opts).then(function(r) {
      if (!r.ok) throw new Error(r.status);
      return r.blob();
    }).then(function(b) {
      clearTimeout(tmr);
      inFlight--;
      T.blob[i] = b;
      T.src[i] = url;
      T.st[i] = 2;
      if (T === HI && isGate[i]) {
        gateDone++;
        checkReady();
      }
      pumpDecode();
      pump();
    }, function() {
      clearTimeout(tmr);
      inFlight--;
      if (!retry && T === HI) {
        fetchFrame(T, i, true, bg);
        return;
      }
      T.st[i] = 3;
      if (T === LO) loDone++;
      if (T === HI && isGate[i]) gateDone++;
      checkReady();
      pump();
    });
  }
  function windowBounds() {
    var ahead = Math.ceil((CAP - 1) * 0.65), behind = CAP - 1 - ahead;
    return dir > 0 ? [reqIdx - behind, reqIdx + ahead, ahead, behind] : [reqIdx - ahead, reqIdx + behind, ahead, behind];
  }
  function nextToDecode() {
    for (var k = 0; k < LOW_IDX.length; k++) {
      var l = LOW_IDX[k];
      if (LO.st[l] === 2 && !LO.bmp[l] && !LO.dec[l]) return [LO, l];
    }
    var wb = windowBounds(), ahead = wb[2], behind = wb[3];
    for (var d = 0; d <= ahead; d++) {
      var a = reqIdx + dir * d;
      if (a >= 0 && a < N && HI.st[a] === 2 && !HI.bmp[a] && !HI.dec[a]) return [HI, a];
      if (d > 0 && d <= behind) {
        var b = reqIdx - dir * d;
        if (b >= 0 && b < N && HI.st[b] === 2 && !HI.bmp[b] && !HI.dec[b]) return [HI, b];
      }
    }
    return null;
  }
  function evictFor(room) {
    var wb = windowBounds();
    while (bmpCount + hiDecInFlight + room > CAP) {
      var far = -1, fd = -1;
      for (var i = 0; i < N; i++) {
        if (!HI.bmp[i] || i >= wb[0] && i <= wb[1]) continue;
        var d = Math.abs(i - reqIdx);
        if (d > fd) {
          fd = d;
          far = i;
        }
      }
      if (far < 0) return false;
      if (HI.bmp[far].close) HI.bmp[far].close();
      HI.bmp[far] = null;
      bmpCount--;
    }
    return true;
  }
  function decodeOne(T, i) {
    if (hasCIB) return createImageBitmap(T.blob[i]);
    var im = new Image();
    im.src = T.src[i];
    return (im.decode ? im.decode() : new Promise(function(res, rej) {
      im.onload = res;
      im.onerror = rej;
    })).then(function() {
      return im;
    });
  }
  function pumpDecode() {
    while (decInFlight < CFG.decodeConc) {
      var n = nextToDecode();
      if (!n) return;
      if (n[0] === HI && !evictFor(1)) return;
      startDecode(n[0], n[1]);
    }
  }
  function startDecode(T, i) {
    T.dec[i] = 1;
    decInFlight++;
    if (T === HI) hiDecInFlight++;
    decodeOne(T, i).then(function(b) {
      T.dec[i] = 0;
      decInFlight--;
      T.bmp[i] = b;
      if (T === HI) {
        hiDecInFlight--;
        bmpCount++;
      } else {
        loDone++;
        T.blob[i] = null;
      }
      if (Math.abs(i - reqIdx) <= CFG.loStride * 2 || drawnKey < 0) kick();
      checkReady();
      pumpDecode();
    }, function() {
      T.dec[i] = 0;
      decInFlight--;
      if (T === HI) hiDecInFlight--;
      else loDone++;
      T.st[i] = 3;
      T.blob[i] = null;
      checkReady();
      pumpDecode();
    });
  }
  function checkReady() {
    if (framesReady || !HI) return;
    if (!(HI.bmp[0] || HI.st[0] === 3)) return;
    if (LOW_IDX.length ? loDone >= Math.ceil(LOW_IDX.length / 2) : gateDone >= GATE.length) {
      framesReady = true;
      pump();
    }
  }
  var pickT = null, pickI = -1;
  function pick(idx) {
    pickT = null;
    pickI = -1;
    var best = 1e9;
    for (var d = 0; d < N && d < best; d++) {
      if (idx - d >= 0 && HI.bmp[idx - d]) {
        pickT = HI;
        pickI = idx - d;
        best = d;
        break;
      }
      if (idx + d < N && HI.bmp[idx + d]) {
        pickT = HI;
        pickI = idx + d;
        best = d;
        break;
      }
    }
    for (var e = 0; e < N && e + CFG.loPenalty < best; e++) {
      if (idx - e >= 0 && LO.bmp[idx - e]) {
        pickT = LO;
        pickI = idx - e;
        break;
      }
      if (idx + e < N && LO.bmp[idx + e]) {
        pickT = LO;
        pickI = idx + e;
        break;
      }
    }
  }
  function setPlayhead(idx) {
    idx = clamp(idx | 0, 0, N - 1);
    if (idx === reqIdx) return;
    dir = idx > reqIdx ? 1 : -1;
    reqIdx = idx;
    pumpDecode();
    pump();
  }
  function drawFrame() {
    if (!cw) return;
    pick(reqIdx);
    if (!pickT) return;
    var key = (pickT === HI ? 0 : N) + pickI;
    if (key === drawnKey) return;
    var im = pickT.bmp[pickI];
    var iw = im.width || im.naturalWidth, ih = im.height || im.naturalHeight;
    if (!iw || !ih) return;
    var s = Math.max(canvas.width / iw, canvas.height / ih);
    var dw = iw * s, dh = ih * s, dx = (canvas.width - dw) * 0.5, dy = (canvas.height - dh) * 0.5;
    ctx.drawImage(im, dx, dy, dw, dh);
    drawnKey = key;
  }
  window.__v3fHero = function() {
    var hi = 0, lo = 0;
    for (var i = 0; i < N; i++) {
      if (HI.st[i] === 2) hi++;
      if (LO.bmp[i]) lo++;
    }
    return { format: avifMode ? "avif" : "webp", frames: N, sharpW: FW, sharpFetched: hi, previews: lo + "/" + LOW_IDX.length, playhead: reqIdx, onScreen: drawnKey < 0 ? null : drawnKey >= N ? "preview " + (drawnKey - N) : "sharp " + drawnKey };
  };
  function setCh(beat, j, o, col) {
    if (beat.o[j] !== o) {
      beat.o[j] = o;
      beat.chars[j].style.opacity = o;
    }
    if (beat.c[j] !== col) {
      beat.c[j] = col;
      beat.chars[j].style.color = col;
    }
  }
  function showBeat(b) {
    if (b.shown) return;
    b.shown = true;
    b.el.style.opacity = "1";
    b.el.style.visibility = "visible";
  }
  function paintText(p) {
    var textSpan = CFG.beatPx * beats.length / extraPx();
    var tp = clamp((p - CFG.lead) / textSpan, 0, 1);
    var raw = tp * beats.length;
    var d = Math.floor(raw), C;
    if (d >= beats.length) {
      d = beats.length - 1;
      C = 1;
    } else {
      C = raw - d;
    }
    for (var k = 0; k < beats.length; k++) {
      if (k === d) continue;
      var ob = beats[k];
      showBeat(ob);
      if (ob.cleared) continue;
      for (var j = 0; j < ob.n; j++) setCh(ob, j, "0", CFG.accent);
      ob.cleared = true;
    }
    var beat = beats[d];
    showBeat(beat);
    beat.cleared = false;
    var V = 0.82, A = V + 0.1;
    var G = Math.min(C / V, 1);
    var L = (C - A) / (1 - A);
    L *= 2;
    var Y = clamp(L, 0, 1);
    var R = beat.n || 1;
    var front = C / V;
    for (var g = 0; g < beat.n; g++) {
      var q = g / R, O = (g + 1) / R;
      var B = clamp((G - q) / (O - q), 0, 1);
      var Z = clamp((Y - q) / (O - q), 0, 1);
      var T = pow2out(B) * (1 - pow2in(Z));
      var mc = (g + 0.5) / R;
      var recency = front - mc;
      var tealAmt = recency < 0 ? 1 : clamp(1 - recency / CFG.TAIL, 0, 1);
      setCh(beat, g, T.toFixed(3), tealMix(tealAmt));
    }
  }
  var pre = null, preTop = null, preBot = null, preTopInner = null, preBotInner = null, logos = [];
  var preT = 0, gone = false, dismissing = false, et = 0;
  var logoOp = 0, logoReady = false, scrollLocked = false;
  var MIN_HOLD = reduce ? 0 : 0.9;
  var EXIT_S = reduce ? 0.35 : 1.1;
  function expoInOut(x) {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2;
  }
  function preBlock(e) {
    if (!gone) {
      e.preventDefault();
      e.stopPropagation();
    }
  }
  function buildPreloader() {
    pre = document.createElement("div");
    pre.className = "v3f-preloader";
    pre.setAttribute("aria-hidden", "true");
    preTop = document.createElement("div");
    preTop.className = "v3f-pre-half v3f-pre-top";
    preBot = document.createElement("div");
    preBot.className = "v3f-pre-half v3f-pre-bottom";
    preTopInner = document.createElement("div");
    preTopInner.className = "v3f-pre-inner";
    preBotInner = document.createElement("div");
    preBotInner.className = "v3f-pre-inner";
    function mkLogo() {
      var img = document.createElement("img");
      img.className = "v3f-pre-logo";
      img.alt = "SPM";
      img.decoding = "async";
      img.fetchPriority = "high";
      img.onload = function() {
        logoReady = true;
      };
      img.onerror = function() {
        logoReady = true;
      };
      img.src = CFG.logo;
      logos.push(img);
      return img;
    }
    preTopInner.appendChild(mkLogo());
    preBotInner.appendChild(mkLogo());
    preTop.appendChild(preTopInner);
    preBot.appendChild(preBotInner);
    pre.appendChild(preTop);
    pre.appendChild(preBot);
    (document.body || document.documentElement).appendChild(pre);
    if (logos[0].complete && logos[0].naturalWidth) logoReady = true;
    try {
      document.documentElement.style.overflow = "hidden";
      window.scrollTo(0, 0);
      window.addEventListener("wheel", preBlock, { passive: false, capture: true });
      window.addEventListener("touchmove", preBlock, { passive: false, capture: true });
      scrollLocked = true;
    } catch (e) {
    }
  }
  function unlockScroll() {
    if (!scrollLocked) return;
    try {
      document.documentElement.style.overflow = "";
      window.removeEventListener("wheel", preBlock, { capture: true });
      window.removeEventListener("touchmove", preBlock, { capture: true });
    } catch (e) {
    }
    scrollLocked = false;
  }
  function stepPreloader(dt) {
    if (gone || !pre) return;
    preT += dt;
    if (!dismissing) {
      logoOp += (1 - logoOp) * (1 - Math.pow(0.88, dt * 60));
      for (var i = 0; i < logos.length; i++) logos[i].style.opacity = logoOp.toFixed(3);
      var ready = framesReady && logoReady && preT >= MIN_HOLD;
      if (ready || preT * 1e3 > CFG.preloadCapMs) {
        dismissing = true;
        unlockScroll();
        document.documentElement.classList.add("v3f-media-ready");
      }
    } else {
      et += dt / EXIT_S;
      var k = expoInOut(clamp(et, 0, 1));
      preTop.style.transform = "translate3d(0," + (-100 * k).toFixed(3) + "%,0)";
      preBot.style.transform = "translate3d(0," + (100 * k).toFixed(3) + "%,0)";
      preTopInner.style.transform = "translate3d(0," + (50 * k).toFixed(3) + "%,0)";
      preBotInner.style.transform = "translate3d(0," + (-50 * k).toFixed(3) + "%,0)";
      var lo = clamp(1 - k * 1.8, 0, 1);
      for (var j = 0; j < logos.length; j++) logos[j].style.opacity = lo.toFixed(3);
      if (et >= 1) {
        pre.style.display = "none";
        gone = true;
      }
    }
  }
  var lastPre = 0;
  function preLoop(now) {
    var dt = lastPre ? clamp((now - lastPre) / 1e3, 0, 0.05) : 0.016;
    lastPre = now;
    stepPreloader(dt);
    if (!gone) requestAnimationFrame(preLoop);
  }
  var cursor = null, curX = 0, curY = 0, tgX = 0, tgY = 0, curOn = false, curVis = "";
  var finePointer = matchMedia("(pointer: fine)").matches;
  function buildCursor() {
    if (!finePointer) return;
    cursor = document.createElement("div");
    cursor.className = "v3f-cursor";
    cursor.setAttribute("aria-hidden", "true");
    cursor.textContent = "D\xE9filer pour explorer";
    (document.body || document.documentElement).appendChild(cursor);
    tgX = curX = window.innerWidth / 2;
    tgY = curY = window.innerHeight / 2;
    cursor.style.transform = "translate3d(" + (curX + 16).toFixed(1) + "px," + (curY + 16).toFixed(1) + "px,0)";
    wrap.addEventListener("mousemove", function(e) {
      tgX = e.clientX;
      tgY = e.clientY;
      curOn = true;
      kick();
    }, { passive: true });
    wrap.addEventListener("mouseenter", function() {
      curOn = true;
      kick();
    }, { passive: true });
    wrap.addEventListener("mouseleave", function() {
      curOn = false;
      kick();
    }, { passive: true });
  }
  function updateCursor(a) {
    if (!cursor) return false;
    var dx = tgX - curX, dy = tgY - curY;
    var moving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
    if (moving) {
      curX += dx * a;
      curY += dy * a;
      cursor.style.transform = "translate3d(" + (curX + 16).toFixed(1) + "px," + (curY + 16).toFixed(1) + "px,0)";
    }
    var vis = curOn && dispP < 0.82 ? "1" : "0";
    if (vis !== curVis) {
      curVis = vis;
      cursor.style.opacity = vis;
    }
    return moving;
  }
  var dispP = 0, lastTextP = -1, lastHint = "", running = false, lastT = 0;
  function progress() {
    return clamp(-wrap.getBoundingClientRect().top / extraPx(), 0, 1);
  }
  function kick() {
    if (running || reduce) return;
    running = true;
    lastT = 0;
    requestAnimationFrame(frame);
  }
  function frame(now) {
    var dt = lastT ? clamp((now - lastT) / 16.667, 0.25, 4) : 1;
    lastT = now;
    var targetP = progress();
    dispP = lerp(dispP, targetP, 1 - Math.pow(1 - CFG.smooth, dt));
    if (Math.abs(dispP - targetP) < 2e-4) dispP = targetP;
    setPlayhead(Math.round(dispP * (N - 1)));
    drawFrame();
    if (dispP !== lastTextP) {
      lastTextP = dispP;
      paintText(dispP);
    }
    if (hint) {
      var ho = clamp(1 - dispP / 0.1, 0, 1).toFixed(2);
      if (ho !== lastHint) {
        lastHint = ho;
        hint.style.opacity = ho;
      }
    }
    var curMoving = updateCursor(1 - Math.pow(1 - 0.16, dt));
    if (dispP !== targetP || curMoving) requestAnimationFrame(frame);
    else running = false;
  }
  function reducedMotion() {
    beats.forEach(function(bt, i) {
      var last = i === beats.length - 1;
      bt.el.style.opacity = last ? 1 : 0;
      bt.el.style.visibility = last ? "visible" : "hidden";
      bt.el.style.transform = "translateX(-50%)";
      bt.chars.forEach(function(c) {
        c.style.opacity = 1;
        c.style.color = "#fff";
      });
    });
    var mid = Math.round(N * 0.4);
    var im = new Image();
    im.onload = function() {
      HI.bmp[mid] = im;
      reqIdx = mid;
      drawnKey = -1;
      drawFrame();
      framesReady = true;
    };
    im.onerror = function() {
      framesReady = true;
    };
    im.src = FRAMES[mid];
  }
  var rzRaf = 0;
  function onResize(fn) {
    return function() {
      if (rzRaf) return;
      rzRaf = requestAnimationFrame(function() {
        rzRaf = 0;
        fn();
      });
    };
  }
  function boot() {
    buildPreloader();
    requestAnimationFrame(preLoop);
    detectAvif(function(ok) {
      chooseFrames(ok);
      setupPipeline();
      start();
    });
  }
  function start() {
    if (reduce) {
      wrap.style.minHeight = "100vh";
      sizeCanvas();
      window.addEventListener("resize", onResize(function() {
        sizeCanvas();
        drawFrame();
      }), { passive: true });
      reducedMotion();
      return;
    }
    layout();
    window.addEventListener("resize", onResize(layout), { passive: true });
    window.addEventListener("scroll", kick, { passive: true });
    buildCursor();
    pump();
    kick();
  }
  boot();
})();
