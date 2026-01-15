let cart = [];
const currentLang = "ar";
const paymentCodLabel =
  "\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645";
const paymentCashierLabel =
  "\u0627\u0644\u062f\u0641\u0639 \u0639\u0646\u062f \u0627\u0644\u0643\u0627\u0634\u064a\u0631";
const phoneOptionalText =
  "(\u0627\u062e\u062a\u064a\u0627\u0631\u064a - \u0644\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0643)";
const phoneRequiredText =
  "(\u0645\u0637\u0644\u0648\u0628 - \u0644\u0644\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0643)";

// دالة لحساب السعر الإجمالي للمنتج مع الأحجام والاضافات
function updateProductPrice(productId) {
  // الحصول على الحجم المختار (إن وجد)
  const sizeInput = document.querySelector(
    `input[name="size_${productId}"]:checked`
  );
  let displayPrice = 0;

  if (sizeInput) {
    // إذا كان هناك حجم محدد، السعر = سعر الحجم مباشرة
    try {
      const sizeData = JSON.parse(sizeInput.value);
      displayPrice = parseFloat(sizeData.price) || 0;
    } catch (e) {
      console.error(`Error parsing size data for product ${productId}:`, e);
      displayPrice = 0;
    }
  } else {
    // إذا لم يكن هناك حجم، استخدم السعر الأساسي من data attribute
    const productElement = document.querySelector(
      `[data-product-id="${productId}"]`
    );
    if (productElement) {
      displayPrice =
        parseFloat(productElement.getAttribute("data-base-price")) || 0;
    }
  }

  // حساب سعر الاضافات
  let addOnsPrice = 0;
  const checkedFlavors = document.querySelectorAll(
    `input[class*="flavor-check-${productId}"]:checked`
  );
  checkedFlavors.forEach((flavor) => {
    try {
      const flavorData = JSON.parse(flavor.value);
      // تحويل price إلى رقم بشكل صريح
      addOnsPrice += parseFloat(flavorData.price) || 0;
    } catch (e) {
      console.error(`Error parsing flavor data for product ${productId}:`, e);
    }
  });

  // السعر النهائي = سعر الحجم (أو السعر الأساسي) + سعر الاضافات
  const totalPrice = displayPrice + addOnsPrice;
  const priceElement = document.getElementById(`price_${productId}`);

  if (priceElement) {
    priceElement.textContent = totalPrice.toFixed(2) + " ₪";
  }
}

// Set initial displayed price for products (if sizes exist show the minimum price)
function initAllProductPrices() {
  document.querySelectorAll(".price-tag").forEach((priceEl) => {
    const idMatch = priceEl.id.match(/price_(\d+)/);
    if (!idMatch) return;
    const pid = idMatch[1];

    // الحصول على السعر الأساسي للمنتج
    const productElement = document.querySelector(`[data-product-id="${pid}"]`);
    let basePrice = 0;
    if (productElement) {
      basePrice =
        parseFloat(productElement.getAttribute("data-base-price")) || 0;
    }

    const sizeInputs = document.querySelectorAll(`input[name="size_${pid}"]`);
    if (sizeInputs.length > 0) {
      // البحث عن أقل سعر من الأحجام
      let minPrice = null;
      sizeInputs.forEach((si) => {
        try {
          const sd = JSON.parse(si.value);
          const sizePrice = parseFloat(sd.price);
          if (minPrice === null || sizePrice < minPrice) {
            minPrice = sizePrice;
          }
        } catch (e) {
          // ignore
        }
      });
      // عرض أقل سعر للحجم
      if (minPrice !== null) {
        priceEl.textContent = minPrice.toFixed(2) + " ₪";
      } else {
        priceEl.textContent = basePrice.toFixed(2) + " ₪";
      }
    } else {
      // إذا لم تكن هناك أحجام، عرض السعر الأساسي فقط
      priceEl.textContent = basePrice.toFixed(2) + " ₪";
    }
  });
}

function addToCart(product, productId) {
  // الحصول على السعر الأساسي للمنتج
  const productElement = document.querySelector(
    `[data-product-id="${productId}"]`
  );
  let basePrice =
    parseFloat(productElement?.getAttribute("data-base-price")) ||
    parseFloat(product.price) ||
    0;

  // الحصول على الحجم المختار
  const sizeInput = document.querySelector(
    `input[name="size_${productId}"]:checked`
  );
  let selectedSize = null;
  let sizePrice = 0; // السعر الكامل للحجم

  if (sizeInput) {
    try {
      selectedSize = JSON.parse(sizeInput.value);
      // استخدم price الحجم (السعر الكامل للحجم)
      sizePrice = parseFloat(selectedSize.price) || 0;
    } catch (e) {
      selectedSize = null;
      sizePrice = 0;
    }
  }

  // الحصول على الاضافات المختارة
  const selectedFlavors = [];
  const checkedFlavors = document.querySelectorAll(
    `input[class*="flavor-check-${productId}"]:checked`
  );
  let flavorsPrice = 0;

  checkedFlavors.forEach((flavor) => {
    try {
      const flavorData = JSON.parse(flavor.value);
      selectedFlavors.push(flavorData);
      flavorsPrice += flavorData.price;
    } catch (e) {
      // تجاهل الأخطاء
    }
  });

  // البحث عن منتج نفس المواصفات في السلة
  const existingItem = cart.find(
    (item) =>
      item.id === product.id &&
      JSON.stringify(item.selectedSize) === JSON.stringify(selectedSize) &&
      JSON.stringify(item.selectedFlavors) === JSON.stringify(selectedFlavors)
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
      selectedSize: selectedSize,
      selectedFlavors: selectedFlavors,
      basePrice: basePrice,
      sizePrice: sizePrice,
      flavorsPrice: flavorsPrice,
    });
  }

  updateCartBadge();
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("cartBadge").textContent = totalItems;
}

function showCart() {
  const cartItemsContainer = document.getElementById("cartItems");
  let cartHtml = "";
  let total = 0;

  if (cart.length === 0) {
    cartHtml = `<p class="text-center">لا توجد منتجات في السلة</p>`;
  } else {
    cartHtml =
      '<div class="table-responsive"><table class="table table-sm cart-table">';
    cartHtml +=
      "<thead><tr><th>المنتج</th><th>الحجم</th><th>الاضافات</th><th>الكمية</th><th>السعر</th><th></th></tr></thead><tbody>";

    cart.forEach((item, index) => {
      const basePrice = parseFloat(item.basePrice) || 0;
      const sizePrice = parseFloat(item.sizePrice) || 0;
      const flavorsPrice = parseFloat(item.flavorsPrice) || 0;
      const quantity = parseInt(item.quantity) || 1;

      // السعر = سعر الحجم (إن وجد) أو السعر الأساسي + سعر الاضافات
      const itemPrice = (sizePrice || basePrice) + flavorsPrice;
      const itemTotal = itemPrice * quantity;
      total += itemTotal;

      let sizeText = '<span class="badge bg-secondary">بدون حجم</span>';
      if (item.selectedSize) {
        sizeText = `<span class="badge bg-info">${
          currentLang === "ar"
            ? item.selectedSize.name_ar
            : item.selectedSize.name_en
        }</span>`;
      }

      let flavorsText =
        '<span class="badge bg-light text-dark">بدون اضافات</span>';
      if (item.selectedFlavors && item.selectedFlavors.length > 0) {
        flavorsText = item.selectedFlavors
          .map(
            (f) =>
              `<span class="badge bg-danger addon-badge">${
                currentLang === "ar" ? f.name_ar : f.name_en
              }</span>`
          )
          .join(" ");
      }

      cartHtml += `
                        <tr>
                            <td style="max-width: 150px; word-wrap: break-word;">${
                              currentLang === "ar" ? item.name_ar : item.name_en
                            }</td>
                            <td>${sizeText}</td>
                            <td>${flavorsText}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index}, -1)">-</button>
                                <span class="mx-2 badge bg-primary" style="min-width: 25px;">${
                                  item.quantity
                                }</span>
                                <button class="btn btn-sm btn-outline-secondary" onclick="updateQuantity(${index}, 1)">+</button>
                            </td>
                            <td>${itemTotal.toFixed(2)} ₪</td>
                            <td>
                                <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
    });

    cartHtml += "</tbody></table></div>";
  }

  cartItemsContainer.innerHTML = cartHtml;
  document.getElementById("cartTotal").textContent = total.toFixed(2) + " ₪";

  // فحص إذا كان modal مفتوح بالفعل
  const modal = document.getElementById("orderModal");
  const isModalShown = modal.classList.contains("show");

  if (!isModalShown) {
    // إذا كان modal مغلق، افتحه
    const modalBootstrap = bootstrap.Modal.getOrCreateInstance(modal);
    modalBootstrap.show();
  }
}

function updateQuantity(index, change) {
  if (cart[index]) {
    const currentQuantity = parseInt(cart[index].quantity) || 1;
    cart[index].quantity = Math.max(0, currentQuantity + change);
    if (cart[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      showCart(); // تحديث العربة
      updateCartBadge();
    }
  }
}

function removeFromCart(index) {
  cart.splice(index, 1);
  if (cart.length > 0) {
    showCart(); // تحديث العربة فقط إذا كان هناك عناصر
  } else {
    const cartItemsContainer = document.getElementById("cartItems");
    cartItemsContainer.innerHTML = `<p class="text-center">لا توجد منتجات في السلة</p>`;
    document.getElementById("cartTotal").textContent = "0.00 ₪";
  }
  updateCartBadge();
}

function selectOrderType(type) {
  if (type === "dine_in") {
    document.getElementById("orderTypeDineIn").checked = true;
  } else {
    document.getElementById("orderTypeDelivery").checked = true;
  }
  toggleDeliveryFields();
  initAllProductPrices();
  // also update displayed price for each product to include any add-ons (none selected now) or formatting
  document.querySelectorAll(".price-tag").forEach((el) => {
    const idMatch = el.id.match(/price_(\d+)/);
    if (idMatch) updateProductPrice(idMatch[1]);
  });
}

function toggleDeliveryFields() {
  const orderTypeDineIn = document.getElementById("orderTypeDineIn");
  const orderTypeDelivery = document.getElementById("orderTypeDelivery");
  const dineInFields = document.getElementById("dineInFields");
  const deliveryFields = document.getElementById("deliveryFields");
  const orderTypeCards = document.querySelectorAll(".order-type-card");

  if (orderTypeDineIn && orderTypeDelivery && dineInFields && deliveryFields) {
    // تحديث مظهر البطاقات
    orderTypeCards.forEach((card) => {
      card.style.borderColor = "#dee2e6";
      card.style.backgroundColor = "#fff";
    });

    if (orderTypeDelivery.checked) {
      // إظهار حقول التوصيل وإخفاء حقول داخل المطعم
      dineInFields.style.display = "none";
      deliveryFields.style.display = "block";
      // تمييز بطاقة التوصيل
      if (orderTypeCards[1]) {
        orderTypeCards[1].style.borderColor = "#28a745";
        orderTypeCards[1].style.backgroundColor = "#f0f9f4";
      }
      // مسح قيمة رقم الطاولة
      const tableNumber = document.getElementById("tableNumber");
      if (tableNumber) {
        tableNumber.value = "";
        tableNumber.removeAttribute("required");
      }
      // جعل العنوان مطلوب
      const deliveryAddress = document.getElementById("deliveryAddress");
      if (deliveryAddress) {
        deliveryAddress.setAttribute("required", "required");
      }
      // جعل رقم الهاتف مطلوب
      const phone = document.getElementById("phone");
      const phoneHint = document.getElementById("phoneHint");
      if (phone) {
        phone.setAttribute("required", "required");
      }
      if (phoneHint) {
        phoneHint.textContent = phoneRequiredText;
      }
      // تغيير نص طريقة الدفع
      const paymentLabel = document.getElementById("paymentMethodLabel");
      const paymentHidden = document.getElementById("payment_method");
      if (paymentLabel) paymentLabel.textContent = paymentCodLabel;
      if (paymentHidden) paymentHidden.value = "cod";
    } else {
      // إظهار حقول داخل المطعم وإخفاء حقول التوصيل
      dineInFields.style.display = "block";
      deliveryFields.style.display = "none";
      // تمييز بطاقة داخل المطعم
      if (orderTypeCards[0]) {
        orderTypeCards[0].style.borderColor = "#007bff";
        orderTypeCards[0].style.backgroundColor = "#f0f7ff";
      }
      // مسح قيم التوصيل
      const deliveryAddress = document.getElementById("deliveryAddress");
      const phone = document.getElementById("phone");
      if (deliveryAddress) {
        deliveryAddress.value = "";
        deliveryAddress.removeAttribute("required");
      }
      if (phone) phone.value = "";
      // جعل رقم الهاتف غير مطلوب
      const phoneHint = document.getElementById("phoneHint");
      if (phone) {
        phone.removeAttribute("required");
      }
      if (phoneHint) {
        phoneHint.textContent = phoneOptionalText;
      }
      // تغيير نص طريقة الدفع
      const paymentLabel = document.getElementById("paymentMethodLabel");
      const paymentHidden = document.getElementById("payment_method");
      if (paymentLabel) paymentLabel.textContent = paymentCashierLabel;
      if (paymentHidden) paymentHidden.value = "cashier";
      // جعل رقم الطاولة مطلوب
      const tableNumber = document.getElementById("tableNumber");
      if (tableNumber) {
        tableNumber.setAttribute("required", "required");
      }
    }
  }
}

// تهيئة الواجهة عند التحميل وتحميل التخصيصات
document.addEventListener("DOMContentLoaded", function () {
  toggleDeliveryFields();
  // تحديث أسعار جميع المنتجات بناءً على الأحجام المختارة افتراضياً
  document.querySelectorAll("[data-product-id]").forEach((productCard) => {
    const productId = productCard.getAttribute("data-product-id");
    if (productId) {
      updateProductPrice(productId);
    }
  });
  loadMenuCustomizations();
});

// دالة لتحميل التخصيصات من الـ API
function loadMenuCustomizations() {
  const menuUrl = "vanilla";

  fetch(`api/get-menu-settings.php?menu_url=${encodeURIComponent(menuUrl)}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.logo_url) {
        // إضافة اللوجو بجنب اسم المطعم
        const headerWithLogo = document.getElementById("headerWithLogo");
        if (headerWithLogo && !document.getElementById("customMenuLogo")) {
          const logoImg = document.createElement("img");
          logoImg.id = "customMenuLogo";
          logoImg.src = data.logo_url;
          logoImg.alt = "Restaurant Logo";
          logoImg.style.cssText = `
                                height: ${data.logo_size}px;
                                width: auto;
                                border-radius: 12px;
                                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                                transition: all 0.3s ease;
                                cursor: pointer;
                            `;

          // إضافة تأثير hover
          logoImg.onmouseover = function () {
            this.style.transform = "scale(1.08)";
            this.style.boxShadow = "0 6px 25px rgba(0,0,0,0.25)";
          };
          logoImg.onmouseout = function () {
            this.style.transform = "scale(1)";
            this.style.boxShadow = "0 4px 15px rgba(0,0,0,0.15)";
          };

          headerWithLogo.appendChild(logoImg);
        }
      }

      // تحديث نص الفوتر
      if (data.footer_text) {
        document.getElementById("footerDescription").textContent =
          data.footer_text;
      }

      // تحديث روابط الفوتر
      if (data.footer_links && data.footer_links.length > 0) {
        const linksContainer = document.getElementById("footerLinksContainer");
        linksContainer.innerHTML = "";
        data.footer_links.forEach((link) => {
          const a = document.createElement("a");
          a.href = link.url;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
          a.textContent = link.title;
          linksContainer.appendChild(a);
        });
      }

      // تحديث وسائل التواصل الاجتماعي
      if (data.show_social_media && data.social_media) {
        const socialContainer = document.getElementById("socialMediaContainer");
        socialContainer.innerHTML = "";

        const socialIcons = {
          facebook: { icon: "fab fa-facebook", color: "#1877f2" },
          twitter: { icon: "fab fa-twitter", color: "#1da1f2" },
          instagram: { icon: "fab fa-instagram", color: "#e1306c" },
          whatsapp: { icon: "fab fa-whatsapp", color: "#25d366" },
        };

        Object.keys(data.social_media).forEach((platform) => {
          const url = data.social_media[platform];
          if (url) {
            const a = document.createElement("a");
            a.href = url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.style.cssText = `color: ${
              socialIcons[platform]?.color || "#000"
            }; margin: 0 8px;`;

            const i = document.createElement("i");
            i.className = socialIcons[platform]?.icon || "fas fa-link";
            i.style.fontSize = "1.5rem";
            a.appendChild(i);
            socialContainer.appendChild(a);
          }
        });
      }

      // تطبيق الألوان المخصصة إذا لزم الأمر (sidebar, primary, accent)
      if (data.colors) {
        const style = document.createElement("style");
        let css = `:root {`;
        if (data.colors.sidebar)
          css += ` --primary-color: ${data.colors.sidebar};`;
        if (data.colors.primary)
          css += ` --secondary-color: ${data.colors.primary};`;
        if (data.colors.accent)
          css += ` --accent-color: ${data.colors.accent};`;
        css += ` }`;
        style.textContent = css;
        document.head.appendChild(style);
      }
    })
    .catch((error) => {
      console.log("لم يتمكن من تحميل التخصيصات:", error);
      // المتابعة برغم الأخطاء - الواجهة الافتراضية ستعمل بشكل صحيح
    });
}

function submitOrder() {
  const orderTypeInput = document.querySelector(
    'input[name="orderType"]:checked'
  );
  const orderType = orderTypeInput ? orderTypeInput.value : "dine_in";

  // التحقق من الحقول المطلوبة
  const customerName = document.getElementById("customerName").value.trim();
  if (!customerName) {
    alert("يرجى إدخال الاسم");
    return;
  }

  // الحصول على البيانات حسب نوع الطلب
  let table_number = "";
  let phone = "";
  let address = "";

  if (orderType === "delivery") {
    address = document.getElementById("deliveryAddress")?.value.trim() || "";
    phone = document.getElementById("phone")?.value.trim() || "";

    if (!address) {
      alert("يرجى إدخال عنوان التوصيل");
      return;
    }
    if (!phone) {
      alert("يرجى إدخال رقم الهاتف");
      return;
    }
  } else {
    table_number = document.getElementById("tableNumber")?.value.trim() || "";
  }

  // تحويل عناصر السلة إلى تنسيق مناسب للإرسال
  const items = cart.map((item) => {
    const basePrice = item.basePrice || 0;
    const sizePrice = item.sizePrice || 0;
    const flavorsPrice = item.flavorsPrice || 0;
    // السعر النهائي = سعر الحجم (إن وجد) أو السعر الأساسي + سعر الاضافات
    const pricePerItem = (sizePrice || basePrice) + flavorsPrice;

    return {
      product_id: item.id,
      quantity: item.quantity,
      price: basePrice,
      size_id: item.selectedSize ? item.selectedSize.id : null,
      flavor_ids: item.selectedFlavors
        ? item.selectedFlavors.map((f) => f.id)
        : [],
      size_price: sizePrice,
      flavor_price_total: flavorsPrice,
      item_total: pricePerItem * item.quantity,
    };
  });

  const orderData = {
    menu_id: 9,
    items: items,
    customer_name: customerName,
    table_number: table_number,
    order_type: orderType,
    phone: phone,
    payment_method:
      document.getElementById("payment_method")?.value ||
      (orderType === "delivery" ? "cod" : "cashier"),
    address: address,
    notes: document.getElementById("notes").value,
    total_amount: parseFloat(
      document
        .getElementById("cartTotal")
        .textContent.replace(/[^0-9\.-]+/g, "")
    ),
  };

  // إرسال الطلب إلى الخادم
  fetch("api/submit-order.php", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // تنظيف السلة وإغلاق النموذج
        cart = [];
        updateCartBadge();
        bootstrap.Modal.getInstance(
          document.getElementById("orderModal")
        ).hide();
        // إعادة تعيين النموذج
        document.getElementById("orderForm").reset();
        toggleDeliveryFields(); // إعادة تعيين الحقول

        // إذا كان هناك رابط واتساب، افتحه مباشرة
        if (data.whatsapp_link) {
          // استخدام location.href بدلاً من window.open لتجنب مشكلة Safari
          window.location.href = data.whatsapp_link;
        } else {
          // إظهار رسالة النجاح داخل الصفحة
          showSuccessMessage(
            "تم إرسال الطلب بنجاح! سيتم التواصل/التجهيز قريبًا."
          );
        }
      } else {
        showErrorMessage("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      showErrorMessage("حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.");
    });
}

// دالة لعرض رسالة النجاح داخل الصفحة
function showSuccessMessage(message) {
  const toast = document.createElement("div");
  toast.className = "success-toast";
  toast.innerHTML = `
                <div class="toast-content">
                    <i class="fas fa-check-circle"></i>
                    <span>${message}</span>
                </div>
            `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// دالة لعرض رسالة الخطأ داخل الصفحة
function showErrorMessage(message) {
  const toast = document.createElement("div");
  toast.className = "error-toast";
  toast.innerHTML = `
                <div class="toast-content">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>${message}</span>
                </div>
            `;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("show");
  }, 100);

  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
