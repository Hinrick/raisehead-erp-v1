import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Users ──────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const hashedUser = await bcrypt.hash('user123', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@raisehead.studio' },
      update: {},
      create: { email: 'admin@raisehead.studio', password: hashedPassword, name: '系統管理員', role: 'ADMIN' },
    }),
    prisma.user.upsert({
      where: { email: 'alice@raisehead.studio' },
      update: {},
      create: { email: 'alice@raisehead.studio', password: hashedUser, name: '陳雅琪', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'bob@raisehead.studio' },
      update: {},
      create: { email: 'bob@raisehead.studio', password: hashedUser, name: '林志偉', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'carol@raisehead.studio' },
      update: {},
      create: { email: 'carol@raisehead.studio', password: hashedUser, name: '張美玲', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'david@raisehead.studio' },
      update: {},
      create: { email: 'david@raisehead.studio', password: hashedUser, name: '李建宏', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'emma@raisehead.studio' },
      update: {},
      create: { email: 'emma@raisehead.studio', password: hashedUser, name: '黃雅芳', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'frank@raisehead.studio' },
      update: {},
      create: { email: 'frank@raisehead.studio', password: hashedUser, name: '吳宗翰', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'grace@raisehead.studio' },
      update: {},
      create: { email: 'grace@raisehead.studio', password: hashedUser, name: '劉怡君', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'henry@raisehead.studio' },
      update: {},
      create: { email: 'henry@raisehead.studio', password: hashedUser, name: '周家豪', role: 'USER' },
    }),
    prisma.user.upsert({
      where: { email: 'iris@raisehead.studio' },
      update: {},
      create: { email: 'iris@raisehead.studio', password: hashedUser, name: '蔡佳蓉', role: 'USER' },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // ── Tags ───────────────────────────────────────────
  const tagData = [
    { name: 'client', color: '#6D28D9' },
    { name: 'supplier', color: '#059669' },
    { name: 'partner', color: '#D97706' },
    { name: 'prospect', color: '#2563EB' },
    { name: 'vip', color: '#DC2626' },
    { name: 'inactive', color: '#6B7280' },
    { name: 'overseas', color: '#0891B2' },
    { name: 'government', color: '#4338CA' },
    { name: 'startup', color: '#EA580C' },
    { name: 'enterprise', color: '#0D9488' },
  ];

  const tags: Record<string, string> = {};
  for (const t of tagData) {
    const tag = await prisma.tag.upsert({
      where: { name: t.name },
      update: {},
      create: t,
    });
    tags[t.name] = tag.id;
  }

  console.log(`Created ${tagData.length} tags`);

  // ── Companies ──────────────────────────────────────
  const companyData = [
    { id: 'company-01', name: '鼎新科技股份有限公司', taxId: '12345678', address: '台北市信義區信義路五段7號', phone: '02-2720-1234', email: 'info@dingxin.com.tw', industry: '資訊科技', website: 'https://www.dingxin.com.tw' },
    { id: 'company-02', name: '聯華電子股份有限公司', taxId: '22334455', address: '新竹市新竹科學園區力行二路3號', phone: '03-578-0011', email: 'contact@umc.com', industry: '半導體', website: 'https://www.umc.com' },
    { id: 'company-03', name: '綠能環保科技有限公司', taxId: '33445566', address: '台中市西屯區台灣大道三段99號', phone: '04-2255-6677', email: 'hello@greentech.tw', industry: '環保能源' },
    { id: 'company-04', name: '大立光電股份有限公司', taxId: '44556677', address: '台中市南屯區精科路25號', phone: '04-2359-8800', email: 'sales@largan.com', industry: '光電', fax: '04-2359-8801' },
    { id: 'company-05', name: '誠品生活股份有限公司', taxId: '55667788', address: '台北市松山區菸廠路88號', phone: '02-6636-5888', email: 'service@eslite.com', industry: '零售文創', website: 'https://www.eslite.com' },
    { id: 'company-06', name: '雲端數位有限公司', taxId: '66778899', address: '台北市內湖區瑞光路513巷22號', phone: '02-8791-3456', email: 'info@clouddigital.tw', industry: '雲端服務' },
    { id: 'company-07', name: '台灣設計研究院', taxId: '77889900', address: '台北市松山區光復南路133號', phone: '02-2745-8199', email: 'contact@tdri.org.tw', industry: '設計研究', website: 'https://www.tdri.org.tw' },
    { id: 'company-08', name: '海洋生技股份有限公司', taxId: '88990011', address: '高雄市前鎮區成功二路88號', phone: '07-338-1234', email: 'info@oceanbio.com.tw', industry: '生物科技' },
    { id: 'company-09', name: '智慧建築股份有限公司', taxId: '99001122', address: '台北市大安區復興南路一段390號', phone: '02-2700-5678', email: 'service@smartbuild.tw', industry: '建築營造', notes: '主要承接公共工程及智慧建築專案' },
    { id: 'company-10', name: '風格餐飲集團', taxId: '10112233', address: '台北市中山區南京東路二段100號', phone: '02-2567-8900', email: 'info@stylefood.tw', industry: '餐飲', website: 'https://www.stylefood.tw' },
  ];

  for (const c of companyData) {
    await prisma.company.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log(`Created ${companyData.length} companies`);

  // ── Contacts ───────────────────────────────────────
  const contactData = [
    { id: 'contact-01', displayName: '王小明', firstName: '小明', lastName: '王', email: 'wang.xiaoming@dingxin.com.tw', phone: '0912-345-678', nickname: '阿明', gender: 'male', birthday: new Date('1985-03-15'), taxId: 'A123456789' },
    { id: 'contact-02', displayName: '陳美華', firstName: '美華', lastName: '陳', middleName: '玉', email: 'chen.meihua@umc.com', phone: '0923-456-789', namePrefix: '博士', gender: 'female', birthday: new Date('1978-07-22') },
    { id: 'contact-03', displayName: '林志強', firstName: '志強', lastName: '林', email: 'lin.zhiqiang@greentech.tw', phone: '0934-567-890', nickname: '強哥', gender: 'male' },
    { id: 'contact-04', displayName: '張雅婷', firstName: '雅婷', lastName: '張', email: 'chang.yating@largan.com', phone: '0945-678-901', address: '台中市南屯區大墩路100號', gender: 'female', birthday: new Date('1990-11-08'), taxId: 'D456789012' },
    { id: 'contact-05', displayName: '李國豪', firstName: '國豪', lastName: '李', email: 'lee.guohao@eslite.com', phone: '0956-789-012', nameSuffix: 'Jr.', gender: 'male' },
    { id: 'contact-06', displayName: '黃麗珍', firstName: '麗珍', lastName: '黃', email: 'huang.lizhen@clouddigital.tw', phone: '0967-890-123', nickname: 'Lily', gender: 'female', birthday: new Date('1992-04-30') },
    { id: 'contact-07', displayName: '劉建志', firstName: '建志', lastName: '劉', email: 'liu.jianzhi@tdri.org.tw', phone: '0978-901-234', notes: '主要負責國際合作案', namePrefix: '教授', gender: 'male' },
    { id: 'contact-08', displayName: '吳佳蓉', firstName: '佳蓉', lastName: '吳', email: 'wu.jiarong@oceanbio.com.tw', phone: '0989-012-345', gender: 'female', birthday: new Date('1988-09-12') },
    { id: 'contact-09', displayName: '周家偉', firstName: '家偉', lastName: '周', email: 'zhou.jiawei@smartbuild.tw', phone: '0910-123-456', gender: 'male', taxId: 'F789012345' },
    { id: 'contact-10', displayName: '蔡宜芳', firstName: '宜芳', lastName: '蔡', email: 'tsai.yifang@stylefood.tw', phone: '0921-234-567', nickname: 'Fanny', gender: 'female', birthday: new Date('1995-01-25') },
  ];

  for (const c of contactData) {
    await prisma.contact.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log(`Created ${contactData.length} contacts`);

  // ── Contact Emails (multi-value) ─────────────────────
  const contactEmailData = [
    // contact-01: 2 emails
    { contactId: 'contact-01', value: 'wang.xiaoming@dingxin.com.tw', label: 'work', primary: true },
    { contactId: 'contact-01', value: 'xiaoming.wang@gmail.com', label: 'home', primary: false },
    // contact-02: 2 emails
    { contactId: 'contact-02', value: 'chen.meihua@umc.com', label: 'work', primary: true },
    { contactId: 'contact-02', value: 'meihua.chen@outlook.com', label: 'home', primary: false },
    // contact-03: 1 email
    { contactId: 'contact-03', value: 'lin.zhiqiang@greentech.tw', label: 'work', primary: true },
    // contact-04: 3 emails
    { contactId: 'contact-04', value: 'chang.yating@largan.com', label: 'work', primary: true },
    { contactId: 'contact-04', value: 'yating.chang@gmail.com', label: 'home', primary: false },
    { contactId: 'contact-04', value: 'yating@freelance.tw', label: 'other', primary: false },
    // contact-05 through 10: 1 email each
    { contactId: 'contact-05', value: 'lee.guohao@eslite.com', label: 'work', primary: true },
    { contactId: 'contact-06', value: 'huang.lizhen@clouddigital.tw', label: 'work', primary: true },
    { contactId: 'contact-06', value: 'lily.huang@yahoo.com.tw', label: 'home', primary: false },
    { contactId: 'contact-07', value: 'liu.jianzhi@tdri.org.tw', label: 'work', primary: true },
    { contactId: 'contact-08', value: 'wu.jiarong@oceanbio.com.tw', label: 'work', primary: true },
    { contactId: 'contact-09', value: 'zhou.jiawei@smartbuild.tw', label: 'work', primary: true },
    { contactId: 'contact-10', value: 'tsai.yifang@stylefood.tw', label: 'work', primary: true },
    { contactId: 'contact-10', value: 'fanny.tsai@hotmail.com', label: 'home', primary: false },
  ];

  // Clear existing and re-create to allow re-running seed
  await prisma.contactEmail.deleteMany({ where: { contactId: { in: contactData.map((c) => c.id) } } });
  await prisma.contactEmail.createMany({ data: contactEmailData });
  console.log(`Created ${contactEmailData.length} contact emails`);

  // ── Contact Phones (multi-value) ─────────────────────
  const contactPhoneData = [
    // contact-01: work + mobile
    { contactId: 'contact-01', value: '0912-345-678', label: 'mobile', primary: true },
    { contactId: 'contact-01', value: '02-2720-1234 ext.101', label: 'work', primary: false },
    // contact-02: mobile + work + fax
    { contactId: 'contact-02', value: '0923-456-789', label: 'mobile', primary: true },
    { contactId: 'contact-02', value: '03-578-0011 ext.200', label: 'work', primary: false },
    { contactId: 'contact-02', value: '03-578-0012', label: 'fax', primary: false },
    // contact-03
    { contactId: 'contact-03', value: '0934-567-890', label: 'mobile', primary: true },
    // contact-04: mobile + home
    { contactId: 'contact-04', value: '0945-678-901', label: 'mobile', primary: true },
    { contactId: 'contact-04', value: '04-2359-1234', label: 'home', primary: false },
    // contact-05 through 10
    { contactId: 'contact-05', value: '0956-789-012', label: 'mobile', primary: true },
    { contactId: 'contact-06', value: '0967-890-123', label: 'mobile', primary: true },
    { contactId: 'contact-06', value: '02-8791-3456 ext.55', label: 'work', primary: false },
    { contactId: 'contact-07', value: '0978-901-234', label: 'mobile', primary: true },
    { contactId: 'contact-08', value: '0989-012-345', label: 'mobile', primary: true },
    { contactId: 'contact-09', value: '0910-123-456', label: 'mobile', primary: true },
    { contactId: 'contact-09', value: '02-2700-5678', label: 'work', primary: false },
    { contactId: 'contact-10', value: '0921-234-567', label: 'mobile', primary: true },
  ];

  await prisma.contactPhone.deleteMany({ where: { contactId: { in: contactData.map((c) => c.id) } } });
  await prisma.contactPhone.createMany({ data: contactPhoneData });
  console.log(`Created ${contactPhoneData.length} contact phones`);

  // ── Contact Addresses (multi-value, structured) ──────
  const contactAddressData = [
    // contact-01: work address
    { contactId: 'contact-01', label: 'work', primary: true, formattedValue: '台北市信義區信義路五段7號 12F', street: '信義路五段7號 12F', city: '台北市', state: '信義區', postalCode: '110', country: '台灣', countryCode: 'TW' },
    // contact-02: work + home
    { contactId: 'contact-02', label: 'work', primary: true, formattedValue: '新竹市新竹科學園區力行二路3號', street: '力行二路3號', city: '新竹市', state: '新竹科學園區', postalCode: '300', country: '台灣', countryCode: 'TW' },
    { contactId: 'contact-02', label: 'home', primary: false, formattedValue: '新竹市東區光復路二段101號', street: '光復路二段101號', city: '新竹市', state: '東區', postalCode: '300', country: '台灣', countryCode: 'TW' },
    // contact-04: work + home
    { contactId: 'contact-04', label: 'work', primary: true, formattedValue: '台中市南屯區精科路25號', street: '精科路25號', city: '台中市', state: '南屯區', postalCode: '408', country: '台灣', countryCode: 'TW' },
    { contactId: 'contact-04', label: 'home', primary: false, formattedValue: '台中市南屯區大墩路100號', street: '大墩路100號', city: '台中市', state: '南屯區', postalCode: '408', country: '台灣', countryCode: 'TW' },
    // contact-07: work
    { contactId: 'contact-07', label: 'work', primary: true, formattedValue: '台北市松山區光復南路133號', street: '光復南路133號', city: '台北市', state: '松山區', postalCode: '105', country: '台灣', countryCode: 'TW' },
    // contact-09: work
    { contactId: 'contact-09', label: 'work', primary: true, formattedValue: '台北市大安區復興南路一段390號', street: '復興南路一段390號', city: '台北市', state: '大安區', postalCode: '106', country: '台灣', countryCode: 'TW' },
  ];

  await prisma.contactAddress.deleteMany({ where: { contactId: { in: contactData.map((c) => c.id) } } });
  await prisma.contactAddress.createMany({ data: contactAddressData });
  console.log(`Created ${contactAddressData.length} contact addresses`);

  // ── ContactCompany junctions ───────────────────────
  const junctionData = [
    { contactId: 'contact-01', companyId: 'company-01', jobTitle: '專案經理', department: '產品研發部' },
    { contactId: 'contact-02', companyId: 'company-02', jobTitle: '業務副總', department: '業務部' },
    { contactId: 'contact-03', companyId: 'company-03', jobTitle: '技術總監', department: '技術部' },
    { contactId: 'contact-04', companyId: 'company-04', jobTitle: '採購主管', department: '採購部' },
    { contactId: 'contact-05', companyId: 'company-05', jobTitle: '企劃經理', department: '行銷企劃部' },
    { contactId: 'contact-06', companyId: 'company-06', jobTitle: '資深工程師', department: '工程部' },
    { contactId: 'contact-07', companyId: 'company-07', jobTitle: '研究員', department: '國際合作組' },
    { contactId: 'contact-08', companyId: 'company-08', jobTitle: '行銷總監', department: '行銷部' },
    { contactId: 'contact-09', companyId: 'company-09', jobTitle: '工地主任', department: '工程部' },
    { contactId: 'contact-10', companyId: 'company-10', jobTitle: '營運長', department: '營運管理部' },
    // Some contacts belong to multiple companies
    { contactId: 'contact-01', companyId: 'company-06', jobTitle: '顧問', department: null },
    { contactId: 'contact-03', companyId: 'company-09', jobTitle: '技術顧問', department: null },
  ];

  for (const j of junctionData) {
    await prisma.contactCompany.upsert({
      where: { contactId_companyId: { contactId: j.contactId, companyId: j.companyId } },
      update: {},
      create: j,
    });
  }

  console.log(`Created ${junctionData.length} contact-company links`);

  // ── ContactTag ─────────────────────────────────────
  const contactTagData = [
    { contactId: 'contact-01', tagName: 'client' },
    { contactId: 'contact-01', tagName: 'vip' },
    { contactId: 'contact-02', tagName: 'client' },
    { contactId: 'contact-03', tagName: 'partner' },
    { contactId: 'contact-04', tagName: 'client' },
    { contactId: 'contact-05', tagName: 'prospect' },
    { contactId: 'contact-06', tagName: 'client' },
    { contactId: 'contact-07', tagName: 'government' },
    { contactId: 'contact-08', tagName: 'startup' },
    { contactId: 'contact-09', tagName: 'enterprise' },
    { contactId: 'contact-10', tagName: 'client' },
  ];

  for (const ct of contactTagData) {
    const tagId = tags[ct.tagName];
    if (tagId) {
      await prisma.contactTag.upsert({
        where: { contactId_tagId: { contactId: ct.contactId, tagId } },
        update: {},
        create: { contactId: ct.contactId, tagId },
      });
    }
  }

  console.log(`Created ${contactTagData.length} contact-tag links`);

  // ── Quotations ─────────────────────────────────────
  const adminId = users[0].id;
  const aliceId = users[1].id;
  const bobId = users[2].id;

  const quotationData = [
    {
      id: 'quot-01', quotationNumber: '#001', projectName: '官網改版設計專案', quotationDate: new Date('2025-01-15'),
      companyId: 'company-01', contactPersonId: 'contact-01', createdById: adminId,
      originalTotal: 180000, discountedTotal: 150000, taxIncluded: true, status: 'SENT' as const,
      items: [
        { itemNumber: 1, description: 'UI/UX 設計', details: '包含首頁及5個子頁面設計', amount: 80000 },
        { itemNumber: 2, description: '前端開發', details: 'RWD切版與互動效果', amount: 60000 },
        { itemNumber: 3, description: '後台管理系統', amount: 40000 },
      ],
      paymentTerms: ['簽約後支付50%', '驗收後支付50%'],
      notes: ['報價有效期限30天', '不含主機費用'],
    },
    {
      id: 'quot-02', quotationNumber: '#002', projectName: 'ERP 系統導入', quotationDate: new Date('2025-02-01'),
      companyId: 'company-02', contactPersonId: 'contact-02', createdById: adminId,
      originalTotal: 500000, discountedTotal: 450000, taxIncluded: true, status: 'ACCEPTED' as const,
      items: [
        { itemNumber: 1, description: '需求分析', amount: 80000 },
        { itemNumber: 2, description: '系統開發', details: '客製化ERP模組開發', amount: 280000 },
        { itemNumber: 3, description: '教育訓練', details: '含2天現場教育訓練', amount: 50000 },
        { itemNumber: 4, description: '一年維護', amount: 90000 },
      ],
      paymentTerms: ['簽約支付30%', '開發完成支付40%', '驗收後支付30%'],
      notes: ['含一年免費維護', '報價有效期限60天'],
    },
    {
      id: 'quot-03', quotationNumber: '#003', projectName: '品牌識別設計', quotationDate: new Date('2025-02-20'),
      companyId: 'company-03', contactPersonId: 'contact-03', createdById: aliceId,
      originalTotal: 120000, discountedTotal: 100000, taxIncluded: true, status: 'DRAFT' as const,
      items: [
        { itemNumber: 1, description: 'Logo 設計', details: '含3組提案', amount: 50000 },
        { itemNumber: 2, description: '名片設計', amount: 15000 },
        { itemNumber: 3, description: '品牌手冊', details: '含色彩規範與使用指南', amount: 55000 },
      ],
      paymentTerms: ['簽約支付50%', '完成支付50%'],
      notes: ['修改次數含3次'],
    },
    {
      id: 'quot-04', quotationNumber: '#004', projectName: 'App 開發專案', quotationDate: new Date('2025-03-10'),
      companyId: 'company-04', contactPersonId: 'contact-04', createdById: bobId,
      originalTotal: 350000, discountedTotal: 320000, taxIncluded: false, status: 'SENT' as const,
      items: [
        { itemNumber: 1, description: 'iOS App 開發', amount: 150000 },
        { itemNumber: 2, description: 'Android App 開發', amount: 150000 },
        { itemNumber: 3, description: 'API 串接', amount: 50000 },
      ],
      paymentTerms: ['簽約支付40%', '中期驗收支付30%', '結案支付30%'],
      notes: ['不含上架費用', '報價未含稅'],
    },
    {
      id: 'quot-05', quotationNumber: '#005', projectName: '電商平台建置', quotationDate: new Date('2025-03-25'),
      companyId: 'company-05', contactPersonId: 'contact-05', createdById: adminId,
      originalTotal: 280000, discountedTotal: 250000, taxIncluded: true, status: 'REJECTED' as const,
      items: [
        { itemNumber: 1, description: '平台前端開發', amount: 100000 },
        { itemNumber: 2, description: '金流串接', details: '綠界 + LINE Pay', amount: 60000 },
        { itemNumber: 3, description: '物流串接', amount: 40000 },
        { itemNumber: 4, description: '後台管理', amount: 80000 },
      ],
      paymentTerms: ['簽約支付50%', '驗收支付50%'],
      notes: ['報價有效期限30天'],
    },
    {
      id: 'quot-06', quotationNumber: '#006', projectName: '雲端架構規劃', quotationDate: new Date('2025-04-05'),
      companyId: 'company-06', contactPersonId: 'contact-06', createdById: aliceId,
      originalTotal: 200000, discountedTotal: 180000, taxIncluded: true, status: 'DRAFT' as const,
      items: [
        { itemNumber: 1, description: 'AWS 架構規劃', amount: 80000 },
        { itemNumber: 2, description: 'CI/CD 建置', amount: 60000 },
        { itemNumber: 3, description: '監控系統建置', amount: 60000 },
      ],
      paymentTerms: ['完成後一次付清'],
      notes: ['不含 AWS 使用費'],
    },
    {
      id: 'quot-07', quotationNumber: '#007', projectName: '展覽空間設計', quotationDate: new Date('2025-04-18'),
      companyId: 'company-07', contactPersonId: 'contact-07', createdById: bobId,
      originalTotal: 450000, discountedTotal: 420000, taxIncluded: true, status: 'ACCEPTED' as const,
      items: [
        { itemNumber: 1, description: '空間設計', details: '含3D模擬圖', amount: 150000 },
        { itemNumber: 2, description: '施工製作', amount: 200000 },
        { itemNumber: 3, description: '燈光音響', amount: 100000 },
      ],
      paymentTerms: ['簽約支付30%', '進場支付40%', '完工支付30%'],
      notes: ['含撤場費用', '展期7天'],
    },
    {
      id: 'quot-08', quotationNumber: '#008', projectName: '行銷影片製作', quotationDate: new Date('2025-05-02'),
      companyId: 'company-08', contactPersonId: 'contact-08', createdById: adminId,
      originalTotal: 160000, discountedTotal: 140000, taxIncluded: true, status: 'SENT' as const,
      items: [
        { itemNumber: 1, description: '腳本企劃', amount: 30000 },
        { itemNumber: 2, description: '拍攝（含場地）', amount: 60000 },
        { itemNumber: 3, description: '後製剪輯', details: '含字幕與配樂', amount: 50000 },
        { itemNumber: 4, description: '修改調整', amount: 20000 },
      ],
      paymentTerms: ['簽約支付50%', '交片支付50%'],
      notes: ['成品為1支90秒影片', '含2次修改'],
    },
    {
      id: 'quot-09', quotationNumber: '#009', projectName: 'IoT 監控系統', quotationDate: new Date('2025-05-20'),
      companyId: 'company-09', contactPersonId: 'contact-09', createdById: aliceId,
      originalTotal: 600000, discountedTotal: 550000, taxIncluded: false, status: 'DRAFT' as const,
      items: [
        { itemNumber: 1, description: '感測器硬體', details: '含10組溫濕度感測器', amount: 200000 },
        { itemNumber: 2, description: '數據平台開發', amount: 250000 },
        { itemNumber: 3, description: '安裝施工', amount: 80000 },
        { itemNumber: 4, description: '教育訓練', amount: 30000 },
        { itemNumber: 5, description: '一年保固', amount: 40000 },
      ],
      paymentTerms: ['簽約支付30%', '設備到貨支付30%', '驗收支付40%'],
      notes: ['報價未含稅', '保固期外維護另計'],
    },
    {
      id: 'quot-10', quotationNumber: '#010', projectName: '餐廳POS系統', quotationDate: new Date('2025-06-01'),
      companyId: 'company-10', contactPersonId: 'contact-10', createdById: bobId,
      originalTotal: 95000, discountedTotal: 85000, taxIncluded: true, status: 'EXPIRED' as const,
      items: [
        { itemNumber: 1, description: 'POS 軟體授權', amount: 35000 },
        { itemNumber: 2, description: '硬體設備', details: '含平板與出單機', amount: 40000 },
        { itemNumber: 3, description: '安裝設定', amount: 20000 },
      ],
      paymentTerms: ['安裝完成一次付清'],
      notes: ['報價有效期限14天', '含3個月免費技術支援'],
    },
  ];

  for (const q of quotationData) {
    const { items, paymentTerms, notes, ...quotation } = q;

    await prisma.quotation.upsert({
      where: { id: q.id },
      update: {},
      create: {
        ...quotation,
        originalTotal: quotation.originalTotal,
        discountedTotal: quotation.discountedTotal,
        items: {
          create: items.map((item) => ({
            itemNumber: item.itemNumber,
            description: item.description,
            details: (item as any).details || null,
            amount: item.amount,
          })),
        },
        paymentTerms: {
          create: paymentTerms.map((content, i) => ({ content, sortOrder: i + 1 })),
        },
        notes: {
          create: notes.map((content, i) => ({ content, sortOrder: i + 1 })),
        },
      },
    });
  }

  console.log(`Created ${quotationData.length} quotations with items, payment terms, and notes`);

  // ── Integration configs ────────────────────────────
  const providers = ['GOOGLE', 'OUTLOOK', 'NOTION'] as const;
  for (const provider of providers) {
    await prisma.integrationConfig.upsert({
      where: { provider },
      update: {},
      create: { provider, enabled: false, config: {} },
    });
  }

  console.log('Created integration configs');
  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
