const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log('--- STARTING COMPLETE QA AUTOMATION TESTING FLOW ---');
  
  const screenshotDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\b6d49b56-876d-4524-8d0f-ee85e0e64ee6';
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  await page.setCacheEnabled(false);

  // Handle page console logs and page errors
  const browserLogs = [];
  page.on('console', (msg) => {
    const text = msg.text();
    browserLogs.push(`[CONSOLE] ${text}`);
    console.log('BROWSER_CONSOLE:', text);
  });
  page.on('pageerror', (err) => {
    browserLogs.push(`[PAGEERROR] ${err.message}`);
    console.error('BROWSER_PAGEERROR:', err.message);
  });

  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('api/db') || url.includes('api/users')) {
      try {
        const text = await response.text();
        console.log(`[NETWORK] Response from ${url}:`, text);
      } catch (err) {
        // Safe to ignore for preflight or failed requests
      }
    }
  });

  // Helper to take screenshots
  let screenshotIndex = 1;
  const takeScreenshot = async (name) => {
    const filename = `qa_${String(screenshotIndex).padStart(2, '0')}_${name}.png`;
    const fullPath = path.join(screenshotDir, filename);
    await page.screenshot({ path: fullPath });
    console.log(`Saved screenshot: ${filename}`);
    screenshotIndex++;
  };

  // Helper to type into input by index using React value setter bypass
  const typeInputByIndex = async (index, text) => {
    await page.evaluate((idx, val) => {
      const setReactInputValue = (input, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
        const prototype = Object.getPrototypeOf(input);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(input, value);
        } else if (valueSetter) {
          valueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      if (inputs[idx]) {
        inputs[idx].focus();
        setReactInputValue(inputs[idx], val);
      }
    }, index, text);
    await delay(100);
  };

  // Helper to type into textarea using React value setter bypass
  const typeTextarea = async (text) => {
    await page.evaluate((val) => {
      const setReactInputValue = (input, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
        const prototype = Object.getPrototypeOf(input);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(input, value);
        } else if (valueSetter) {
          valueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const tx = document.querySelector('textarea');
      if (tx) {
        tx.focus();
        setReactInputValue(tx, val);
      }
    }, text);
    await delay(100);
  };

  // Helper to type into input by placeholder using React value setter bypass
  const typeInputByPlaceholder = async (placeholderText, text) => {
    await page.evaluate((ph, val) => {
      const setReactInputValue = (input, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
        const prototype = Object.getPrototypeOf(input);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(input, value);
        } else if (valueSetter) {
          valueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const inputs = Array.from(document.querySelectorAll('input'));
      const found = inputs.find(i => 
        i.placeholder.toLowerCase().includes(ph.toLowerCase()) || 
        i.placeholder.includes('Geography') || 
        i.placeholder.includes('midterm')
      );
      if (found) {
        found.focus();
        setReactInputValue(found, val);
      }
    }, placeholderText, text);
    await delay(100);
  };

  // Helper to type into input by ID using React value setter bypass
  const typeInputById = async (id, text) => {
    await page.evaluate((inputId, val) => {
      const setReactInputValue = (input, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
        const prototype = Object.getPrototypeOf(input);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(input, value);
        } else if (valueSetter) {
          valueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const input = document.getElementById(inputId);
      if (input) {
        input.focus();
        setReactInputValue(input, val);
      }
    }, id, text);
    await delay(100);
  };

  try {
    // ==========================================
    // STEP 0: Generate Dummy Geography Lesson Image
    // ==========================================
    console.log('\n--- STEP 0: Generating Dummy Geography Lesson Image ---');
    const dummyPage = await browser.newPage();
    await dummyPage.setViewport({ width: 800, height: 600 });
    await dummyPage.setContent(`
      <html>
        <body style="font-family: 'Segoe UI', Arial, sans-serif; padding: 50px; background: white; color: black; line-height: 1.8;">
          <h1 style="color: #4f46e5; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Địa lý lớp 12 - Bài 1: Trái Đất và Hệ Mặt Trời</h1>
          <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">1. Vị trí của Trái Đất trong Hệ Mặt Trời</p>
          <p style="font-size: 14px;">Trái Đất là hành tinh thứ ba tính từ Mặt Trời trong Hệ Mặt Trời. Quỹ đạo quay của Trái Đất quanh Mặt Trời có hình elip gần tròn. Khoảng cách trung bình từ Trái Đất đến Mặt Trời là khoảng 150 triệu km, là vị trí thuận lợi giúp Trái Đất nhận được lượng nhiệt và ánh sáng phù hợp cho sự sống.</p>
          <p style="font-size: 16px; font-weight: bold; margin-top: 20px;">2. Hệ quả chuyển động tự quay của Trái Đất</p>
          <p style="font-size: 14px;">Trái Đất tự quay quanh một trục tưởng tượng nghiêng 66 độ 33 phút so với mặt phẳng quỹ đạo. Việc tự quay từ Tây sang Đông trong 24 giờ tạo ra các hệ quả địa lý quan trọng:</p>
          <ul style="font-size: 14px;">
            <li>Hiện tượng luân phiên ngày và đêm ở khắp mọi nơi trên Trái Đất.</li>
            <li>Sự lệch hướng chuyển động của các vật thể do lực Coriolis.</li>
            <li>Giờ giấc khác nhau trên các khu vực khác nhau (các múi giờ toàn cầu).</li>
          </ul>
        </body>
      </html>
    `);
    const dummyPath = path.join(__dirname, 'dummy-geography.png');
    await dummyPage.screenshot({ path: dummyPath });
    console.log(`Generated dummy geography lesson image at: ${dummyPath}`);
    await dummyPage.close();

    // ==========================================
    // STEP 1: Initial Page Load
    // ==========================================
    console.log('\n--- STEP 1: Loading Initial Login Page ---');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });
    
    // WAIT for login form to render
    await page.waitForSelector('input', { timeout: 10000 });
    await takeScreenshot('initial_load');

    const title = await page.title();
    console.log('Page Title:', title);

    // ==========================================
    // STEP 2: Language Toggle Test
    // ==========================================
    console.log('\n--- STEP 2: Testing Language Toggle ---');
    const getLangText = async () => {
      return await page.evaluate(() => {
        const textLabel = document.querySelector('label');
        return textLabel ? textLabel.textContent.trim() : '';
      });
    };

    console.log('Language state before toggle:', await getLangText());
    
    // Click language switcher
    await page.evaluate(() => {
      const langButtons = Array.from(document.querySelectorAll('button'));
      const langBtn = langButtons.find(b => b.textContent.includes('translateEnglish') || b.textContent.includes('English') || b.textContent.includes('Tiếng Việt'));
      if (langBtn) langBtn.click();
    });
    await delay(1000);
    await takeScreenshot('lang_toggle_english');
    console.log('Language state after toggle:', await getLangText());

    // Switch back to Vietnamese for rest of the tests
    await page.evaluate(() => {
      const langButtons = Array.from(document.querySelectorAll('button'));
      const langBtn = langButtons.find(b => b.textContent.includes('translate') || b.textContent.includes('English') || b.textContent.includes('Tiếng Việt'));
      if (langBtn) langBtn.click();
    });
    await delay(1000);

    // ==========================================
    // STEP 3: Register Teacher User
    // ==========================================
    console.log('\n--- STEP 3: Registering Teacher Account ---');
    // Click Đăng ký tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const regTab = tabs.find(t => t.textContent.includes('Đăng ký') || t.textContent.includes('Register'));
      if (regTab) regTab.click();
    });
    
    // WAIT for register fields to appear (4 inputs)
    await page.waitForFunction(() => {
      return document.querySelectorAll('input').length === 4;
    }, { timeout: 5000 });
    
    await takeScreenshot('register_teacher_tab');

    // Fill registration form for teacher natively
    await typeInputByIndex(0, 'Giáo viên Một');
    await typeInputByIndex(1, 'teacher1');
    await typeInputByIndex(2, 'Password123');
    await typeInputByIndex(3, 'Password123');
    
    // Select role
    await page.select('select', 'teacher');
    
    await delay(1000);
    await takeScreenshot('register_teacher_filled');

    // Submit registration
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Đăng ký tài khoản mới') || b.textContent.includes('Register New Account'));
      if (submitBtn) submitBtn.click();
    });
    
    console.log('Submitting teacher registration...');
    
    // WAIT for registration to complete and redirect to login (switches back to 2 inputs)
    await page.waitForFunction(() => {
      return document.querySelectorAll('input').length === 2;
    }, { timeout: 10000 });
    await takeScreenshot('register_teacher_submitted');

    console.log('Waiting 4 seconds for DB synchronization propagation...');
    await delay(4000);

    // ==========================================
    // STEP 4: Register Student User
    // ==========================================
    console.log('\n--- STEP 4: Registering Student Account ---');
    // Click Đăng ký tab again
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const regTab = tabs.find(t => t.textContent.includes('Đăng ký') || t.textContent.includes('Register'));
      if (regTab) regTab.click();
    });
    
    // WAIT for register fields to appear
    await page.waitForFunction(() => {
      return document.querySelectorAll('input').length === 4;
    }, { timeout: 5000 });

    // Fill registration form for student natively
    await typeInputByIndex(0, 'Học sinh Một');
    await typeInputByIndex(1, 'student1');
    await typeInputByIndex(2, 'Password123');
    await typeInputByIndex(3, 'Password123');
    
    await page.select('select', 'student');
    
    await delay(1000);
    await takeScreenshot('register_student_filled');

    // Submit registration
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Đăng ký tài khoản mới') || b.textContent.includes('Register New Account'));
      if (submitBtn) submitBtn.click();
    });
    
    console.log('Submitting student registration...');
    
    // WAIT for registration to complete and redirect to login
    await page.waitForFunction(() => {
      return document.querySelectorAll('input').length === 2;
    }, { timeout: 10000 });
    
    await takeScreenshot('register_student_submitted');

    // ==========================================
    // STEP 5: Login as Teacher
    // ==========================================
    console.log('\n--- STEP 5: Logging in as Teacher ---');

    // Fill login form for teacher natively
    await typeInputByIndex(0, 'teacher1');
    await typeInputByIndex(1, 'Password123');
    
    await delay(1000);
    await takeScreenshot('login_teacher_filled');

    // Submit login
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Đăng nhập vào hệ thống') || b.textContent.includes('Log In to System'));
      if (submitBtn) submitBtn.click();
    });

    console.log('Submitting teacher login...');
    
    // WAIT for teacher dashboard to load (wait for the sidebar 'aside' element)
    await page.waitForSelector('aside', { timeout: 10000 });
    await takeScreenshot('teacher_dashboard_loaded');

    // ==========================================
    // STEP 6: Create Class as Teacher
    // ==========================================
    console.log('\n--- STEP 6: Creating Class as Teacher ---');
    // Click "Tạo lớp" button
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const createClassBtn = buttons.find(b => b.textContent.includes('Tạo lớp') || b.textContent.includes('Create Class'));
      if (createClassBtn) createClassBtn.click();
    });
    
    // WAIT for create class name input in modal
    await page.waitForFunction(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.some(i => i.placeholder.includes('Lớp Địa Lý') || i.placeholder.includes('Geography'));
    }, { timeout: 5000 });
    
    await takeScreenshot('create_class_modal_open');

    // Enter class name natively
    await typeInputByPlaceholder('Lớp Địa Lý', 'Địa Lý 12A3');
    
    await delay(1000);
    await takeScreenshot('create_class_name_entered');

    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Tạo lớp & Sinh mã') || b.textContent.includes('Create Class & Generate Code'));
      if (submitBtn) submitBtn.click();
    });
    
    // WAIT for class code generation success screen
    await page.waitForFunction(() => {
      const elements = Array.from(document.querySelectorAll('p, span, div'));
      return elements.some(el => el.classList.contains('font-mono') && el.textContent.trim().length === 6);
    }, { timeout: 10000 });
    
    await takeScreenshot('class_created_success');

    // Extract class code
    const classCode = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('p, span, div'));
      const codeEl = elements.find(el => el.classList.contains('font-mono') && el.textContent.trim().length === 6);
      return codeEl ? codeEl.textContent.trim() : '';
    });
    console.log(`Extracted Class Code: [${classCode}]`);

    // Close the class creation modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const doneBtn = buttons.find(b => b.textContent.includes('Hoàn thành') || b.textContent.includes('Done'));
      if (doneBtn) doneBtn.click();
    });
    
    // WAIT for modal to close
    await page.waitForFunction(() => {
      return !document.body.textContent.includes('Mã lớp học của bạn');
    }, { timeout: 5000 });
    await delay(500);

    // ==========================================
    // STEP 7: Upload Material (Teacher)
    // ==========================================
    console.log('\n--- STEP 7: Uploading Material as Teacher ---');
    // Navigate to Upload tab in sidebar
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button, span, a'));
      const uploadTab = buttons.find(b => b.textContent.includes('Tải lên tài liệu') || b.textContent.includes('Upload Materials'));
      if (uploadTab) uploadTab.click();
    });
    
    // WAIT for upload form inputs
    await page.waitForSelector('#lectureNameInput', { timeout: 5000 });
    await takeScreenshot('upload_materials_tab');

    // Enter Document Name natively
    await typeInputById('lectureNameInput', 'Bài 1: Trái Đất và Hệ Mặt Trời');
    await delay(500);

    // Upload the file
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(dummyPath);
    console.log('Selected file for upload. Waiting for OCR parsing (Gemini Multimodal)...');
    
    // WAIT for OCR and upload success message
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Tài liệu đã được mở!') || document.body.textContent.includes('opened successfully!');
    }, { timeout: 180000 }); // Increased timeout to 180s to allow Gemini rate limit retries
    
    await takeScreenshot('upload_complete');

    // ==========================================
    // STEP 8: Summarize and Chat AI Test
    // ==========================================
    console.log('\n--- STEP 8: Testing AI Summary & AI Chat ---');
    
    // Đợi cho đến khi giao diện Workspace chính thực sự hiển thị (nút "Đóng không gian làm việc" xuất hiện)
    console.log('Waiting for active document workspace to load...');
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Đóng Workspace') || document.body.textContent.includes('Close Workspace');
    }, { timeout: 15000 });
    await delay(1000);

    // Click chuyển sang Tab Tóm tắt trước
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'));
      const summaryTab = tabs.find(t => t.textContent.includes('Tóm tắt tài liệu') || t.textContent.includes('Doc Summary'));
      if (summaryTab) summaryTab.click();
    });
    await delay(1500);

    // Click "Tạo bản tóm tắt bài giảng"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const summaryBtn = buttons.find(b => b.textContent.includes('Tạo bản tóm tắt') || b.textContent.includes('Create Summary') || b.textContent.includes('Tải bản tóm tắt'));
      if (summaryBtn) summaryBtn.click();
    });
    
    console.log('Generating AI summary...');
    // WAIT for summary generation to populate content
    await page.waitForFunction(() => {
      const prose = document.querySelector('.prose');
      return prose && prose.textContent.trim().length > 100;
    }, { timeout: 180000 }); // Increased timeout to 180s to allow Gemini rate limit retries
    
    await takeScreenshot('ai_summary_generated');

    // Test Chat ask question
    console.log('Sending message to AI Chat...');
    await page.evaluate(() => {
      const chatTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(t => t.textContent.includes('Chat với AI') || t.textContent.includes('Chat with AI'));
      if (chatTab) chatTab.click();
    });
    await delay(1500);

    // Focus chat textarea and type question natively
    await typeTextarea('Lực nào gây ra sự lệch hướng chuyển động của các vật thể?');
    await delay(500);
    await takeScreenshot('chat_question_typed');

    // Click Send
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendBtn = buttons.find(b => b.type === 'submit' && b.parentElement.innerHTML.includes('textarea'));
      if (sendBtn) sendBtn.click();
    });
    
    console.log('Waiting for AI chat response...');
    // WAIT for AI chat response to generate
    await page.waitForFunction(() => {
      const proseMsgs = Array.from(document.querySelectorAll('.prose'));
      return proseMsgs.length >= 1 && proseMsgs.some(m => m.textContent.includes('Coriolis'));
    }, { timeout: 120000 }); // Increased timeout to 120s to allow Gemini rate limit retries
    
    await takeScreenshot('chat_response_received');

    // ==========================================
    // STEP 9: Generate and Assign Quiz (Teacher)
    // ==========================================
    console.log('\n--- STEP 9: Generating and Assigning Quiz ---');
    // Switch to AI Quiz tab using correct Vietnamese/English translation text
    await page.evaluate(() => {
      const quizTab = Array.from(document.querySelectorAll('button, [role="tab"]')).find(t => t.textContent.includes('Bài tập trắc nghiệm') || t.textContent.includes('Practice Quiz'));
      if (quizTab) quizTab.click();
    });
    await delay(1500);
    await takeScreenshot('quiz_tab_open');

    // Generate Quiz
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const genBtn = buttons.find(b => b.textContent.includes('Bắt đầu ôn tập trắc nghiệm') || b.textContent.includes('Soạn trắc nghiệm') || b.textContent.includes('Generate Quiz') || b.textContent.includes('Soạn lại đề mới'));
      if (genBtn) genBtn.click();
    });
    
    console.log('Generating AI Quiz questions...');
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Xem đáp án') || document.body.textContent.includes('Show Answer');
    }, { timeout: 180000 }); // Increased timeout to 180s to allow Gemini rate limit retries
    
    await takeScreenshot('quiz_questions_generated');

    // Fill assign form title natively
    await typeInputByPlaceholder('Ví dụ: Kiểm tra 15p', 'Kiểm tra Địa lý Bài 1');
    
    // Fill datetime-local inputs for start and end times using React value setter bypass
    await page.evaluate(() => {
      const setReactInputValue = (input, value) => {
        const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
        const prototype = Object.getPrototypeOf(input);
        const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
        if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
          prototypeValueSetter.call(input, value);
        } else if (valueSetter) {
          valueSetter.call(input, value);
        } else {
          input.value = value;
        }
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const datetimeInputs = Array.from(document.querySelectorAll('input[type="datetime-local"]'));
      if (datetimeInputs[0]) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setReactInputValue(datetimeInputs[0], now.toISOString().slice(0, 16));
      }
      if (datetimeInputs[1]) {
        const later = new Date();
        later.setHours(later.getHours() + 2);
        later.setMinutes(later.getMinutes() - later.getTimezoneOffset());
        setReactInputValue(datetimeInputs[1], later.toISOString().slice(0, 16));
      }
    });
    
    // Select class for quiz assignment
    await page.evaluate((code) => {
      const selects = Array.from(document.querySelectorAll('select'));
      const roomSelect = selects.find(s => s.parentElement.innerHTML.includes('Lớp nhận bài') || s.innerHTML.includes(code));
      if (roomSelect && code) {
        roomSelect.value = code;
        roomSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, classCode);
    
    await delay(500);
    await takeScreenshot('quiz_assignment_form_filled');

    // Click "Giao Đề Lớp <ClassCode>"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const assignBtn = buttons.find(b => b.textContent.includes('Giao Đề Lớp') || b.textContent.includes('Giao Đề') || b.textContent.includes('Giao bài'));
      if (assignBtn) assignBtn.click();
    });

    console.log('Assigning quiz to class...');
    
    // WAIT for success notification toast
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Đã giao bài trắc nghiệm') || document.body.textContent.includes('assigned to class');
    }, { timeout: 10000 });
    
    await takeScreenshot('quiz_assigned_success');

    // ==========================================
    // STEP 10: Logout Teacher & Login Student
    // ==========================================
    console.log('\n--- STEP 10: Logging out Teacher & Logging in Student ---');
    // Click logout
    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Đăng xuất') || b.textContent.includes('Đăng xuất') || b.title?.includes('Log Out') || b.textContent.includes('Log Out'));
      if (logoutBtn) logoutBtn.click();
    });
    
    // WAIT for login redirect
    await page.waitForFunction(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.length === 2 && inputs.some(i => i.placeholder.includes('tên đăng nhập') || i.placeholder.includes('username'));
    }, { timeout: 10000 });
    
    await takeScreenshot('teacher_logged_out');

    // Fill login form for student natively
    await typeInputByIndex(0, 'student1');
    await typeInputByIndex(1, 'Password123');
    
    await delay(1000);
    
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Đăng nhập vào hệ thống') || b.textContent.includes('Log In to System'));
      if (submitBtn) submitBtn.click();
    });

    console.log('Submitting student login...');
    
    // WAIT for dashboard
    await page.waitForSelector('aside', { timeout: 10000 });
    await takeScreenshot('student_dashboard_loaded');

    // ==========================================
    // STEP 11: Join Class as Student
    // ==========================================
    console.log('\n--- STEP 11: Joining Class as Student ---');
    if (classCode) {
      // Wait for inline classroom join input to appear on Dashboard
      await page.waitForFunction(() => {
        const inputs = Array.from(document.querySelectorAll('input'));
        return inputs.some(i => i.placeholder.includes('Ví dụ:') || i.placeholder.includes('E.g.,'));
      }, { timeout: 10000 });
      
      await takeScreenshot('join_class_dashboard_ready');

      // Enter class code using React value setter bypass
      await page.evaluate((code) => {
        const setReactInputValue = (input, value) => {
          const valueSetter = Object.getOwnPropertyDescriptor(input, 'value')?.set;
          const prototype = Object.getPrototypeOf(input);
          const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
          if (prototypeValueSetter && valueSetter !== prototypeValueSetter) {
            prototypeValueSetter.call(input, value);
          } else if (valueSetter) {
            valueSetter.call(input, value);
          } else {
            input.value = value;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        };

        const inputs = Array.from(document.querySelectorAll('input'));
        const found = inputs.find(i => i.placeholder.includes('Ví dụ:') || i.placeholder.includes('E.g.,'));
        if (found) {
          setReactInputValue(found, code);
        }
      }, classCode);
      
      await delay(1000);
      await takeScreenshot('join_class_code_entered');

      // Click "Vào lớp" / "Join Class" or "Confirm"
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const joinBtn = buttons.find(b => b.textContent.includes('Vào lớp') || b.textContent.includes('Join Class') || b.textContent.includes('Xác nhận') || b.textContent.includes('Confirm'));
        if (joinBtn) joinBtn.click();
      });
      
      // WAIT for success notification toast
      await page.waitForFunction(() => {
        return document.body.textContent.includes('Đã tham gia lớp học') || document.body.textContent.includes('Joined classroom');
      }, { timeout: 10000 });
      
      await takeScreenshot('class_joined_success');
    } else {
      console.log('Skipping class join test because classCode was not generated/extracted.');
    }

    // ==========================================
    // STEP 12: Take and Submit Quiz (Student)
    // ==========================================
    console.log('\n--- STEP 12: Student Taking Assigned Quiz ---');
    
    const localUser = await page.evaluate(() => localStorage.getItem('user'));
    const localAssignments = await page.evaluate(() => localStorage.getItem('assignments'));
    console.log('[DEBUG] Student localStorage user:', localUser);
    console.log('[DEBUG] Student localStorage assignments:', localAssignments);
    
    // Wait for the "Làm bài thi" or "Start Test" button to appear on the student dashboard
    console.log('Waiting for "Làm bài thi" button to appear...');
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => b.textContent.includes('Làm bài thi') || b.textContent.includes('Start Test'));
    }, { timeout: 15000 });
    
    // Scroll or find assigned quiz card and click "Làm bài thi"
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const startTestBtn = buttons.find(b => b.textContent.includes('Làm bài thi') || b.textContent.includes('Start Test'));
      if (startTestBtn) startTestBtn.click();
    });
    
    console.log('Clicked "Làm bài thi". Waiting for quiz panel...');
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Nộp bài & Xem kết quả') || document.body.textContent.includes('Xem đáp án');
    }, { timeout: 15000 });
    
    await takeScreenshot('student_quiz_view');

    // Answer questions (select the first option for all questions)
    console.log('Answering quiz questions...');
    await page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('button[role="radio"], input[type="radio"], [class*="option-button"]'));
      for (let i = 0; i < options.length; i += 4) {
        if (options[i]) {
          options[i].click();
        }
      }
    });
    await delay(1000);
    await takeScreenshot('student_quiz_answered');

    // Click submit button
    console.log('Clicking submit button...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(b => b.textContent.includes('Nộp bài') || b.textContent.includes('Submit Test'));
      if (submitBtn) submitBtn.click();
    });
    
    // WAIT for grading and results screen
    console.log('Waiting for grading results...');
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Kết quả') || document.body.textContent.includes('Điểm số') || document.body.textContent.includes('Score') || document.body.textContent.includes('Đạt') || document.body.textContent.includes('Thi lại') || document.body.textContent.includes('Điểm thi');
    }, { timeout: 15000 });
    
    await takeScreenshot('student_quiz_result');

    // ==========================================
    // STEP 13: Accessibility and Theme Adjustments
    // ==========================================
    console.log('\n--- STEP 13: Testing Theme & Accessibility Settings ---');
    // Toggle dark mode (ThemeToggle button)
    await page.evaluate(() => {
      const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('giao diện') || b.title?.includes('theme') || b.innerHTML.includes('moon') || b.innerHTML.includes('sun'));
      if (themeBtn) themeBtn.click();
    });
    await delay(1000);
    await takeScreenshot('theme_dark');

    // Toggle back to light mode
    await page.evaluate(() => {
      const themeBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('giao diện') || b.title?.includes('theme') || b.innerHTML.includes('moon') || b.innerHTML.includes('sun'));
      if (themeBtn) themeBtn.click();
    });
    await delay(1000);

    // Open Accessibility Settings Modal
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const accessBtn = buttons.find(b => b.textContent.includes('Cài đặt tiện dụng') || b.innerHTML.includes('lucide-type') || b.querySelector('.lucide-type'));
      if (accessBtn) accessBtn.click();
    });
    
    // WAIT for accessibility settings modal (checks for "Cỡ chữ" or "Font Size")
    await page.waitForFunction(() => {
      return document.body.textContent.includes('Cỡ chữ') || document.body.textContent.includes('Phông chữ');
    }, { timeout: 5000 });
    
    await takeScreenshot('accessibility_settings_open');

    // Adjust settings: Select Roboto Font (Dễ đọc)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const robotoBtn = buttons.find(b => b.textContent.includes('Roboto'));
      if (robotoBtn) robotoBtn.click();
    });
    await delay(1000);
    await takeScreenshot('accessibility_roboto_font');

    // Adjust settings: Select Lexend Font (Hỗ trợ khó đọc)
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const lexendBtn = buttons.find(b => b.textContent.includes('Lexend'));
      if (lexendBtn) lexendBtn.click();
    });
    await delay(1000);
    await takeScreenshot('accessibility_lexend_font');

    // Close Accessibility Popover using Escape key
    await page.keyboard.press('Escape');
    await delay(1000);

    // ==========================================
    // STEP 14: Responsive Viewport Testing
    // ==========================================
    console.log('\n--- STEP 14: Testing Responsive Viewports ---');
    // Mobile Viewport
    console.log('Resizing to Mobile Viewport (360x640)...');
    await page.setViewport({ width: 360, height: 640 });
    await delay(1500);
    await takeScreenshot('viewport_mobile');

    // Tablet Viewport
    console.log('Resizing to Tablet Viewport (768x1024)...');
    await page.setViewport({ width: 768, height: 1024 });
    await delay(1500);
    await takeScreenshot('viewport_tablet');

    // Desktop Viewport
    console.log('Resizing back to Desktop Viewport (1280x800)...');
    await page.setViewport({ width: 1280, height: 800 });
    await delay(1000);

    // ==========================================
    // STEP 15: Student Logout
    // ==========================================
    console.log('\n--- STEP 15: Logging out Student ---');
    await page.evaluate(() => {
      const logoutBtn = Array.from(document.querySelectorAll('button')).find(b => b.title?.includes('Đăng xuất') || b.textContent.includes('Đăng xuất') || b.title?.includes('Log Out') || b.textContent.includes('Log Out'));
      if (logoutBtn) logoutBtn.click();
    });
    
    // WAIT for redirect to login
    await page.waitForFunction(() => {
      const inputs = Array.from(document.querySelectorAll('input'));
      return inputs.length === 2 && inputs.some(i => i.placeholder.includes('tên đăng nhập') || i.placeholder.includes('username'));
    }, { timeout: 10000 });
    
    await takeScreenshot('student_logged_out');

    console.log('\n--- ALL AUTOMATION CHECKS COMPLETED SUCCESSFULLY ---');

  } catch (err) {
    console.error('CRITICAL ERROR DURING AUTOMATION RUN:', err);
    try {
      const errorScreenshotPath = path.join(screenshotDir, 'qa_error_state.png');
      await page.screenshot({ path: errorScreenshotPath });
      console.log(`Saved error screenshot to: ${errorScreenshotPath}`);
    } catch (screer) {
      console.error('Failed to take error screenshot:', screer);
    }
  } finally {
    // Clean up dummy file
    const dummyPath = path.join(__dirname, 'dummy-geography.png');
    if (fs.existsSync(dummyPath)) {
      fs.unlinkSync(dummyPath);
    }
    
    // Close browser
    await browser.close();
    console.log('Puppeteer browser closed.');
  }
})();
