// ============================================
// OC FOUNDRY — BUCKET / CART RENDERER (FAIL-SAFE)
// ============================================

const BACKEND_URL = "https://oc-foundry-server.vercel.app";
const PRICE_EACH = 60; // INR

function getCart() {
  try {
    return JSON.parse(localStorage.getItem("ocFoundryCart") || "[]");
  } catch (e) {
    console.error("Cart read error:", e);
    return [];
  }
}

function saveCart(cart) {
  try {
    localStorage.setItem("ocFoundryCart", JSON.stringify(cart));
  } catch (e) {
    console.error("Cart save error:", e);
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBucket() {
  const cart = getCart();
  const empty = document.getElementById("bucket-empty");
  const content = document.getElementById("bucket-content");
  const list = document.getElementById("bucket-list");

  if (!cart || cart.length === 0) {
    if (empty) {
      empty.hidden = false;
      empty.style.display = "block";
    }
    if (content) {
      content.hidden = true;
      content.style.display = "none";
    }
    return;
  }

  // Show content section
  if (empty) {
    empty.hidden = true;
    empty.style.display = "none";
  }
  if (content) {
    content.hidden = false;
    content.style.display = "block";
  }

  if (list) {
    list.innerHTML = cart.map(item => `
      <article class="bucket-item" data-id="${item.cartId || ''}">
        <div>
          <h3>${escapeHtml(item.name || 'Character')}</h3>
          <p class="meta">${escapeHtml(item.archetype || 'Custom Character')} · ${escapeHtml(item.age || 'Level 1')}</p>
          <p class="hook">“${escapeHtml(item.hook || '')}”</p>
          <button class="remove-item" data-remove="${item.cartId || ''}" type="button">Remove from bucket</button>
        </div>
        <div class="price">₹${PRICE_EACH}</div>
      </article>
    `).join("");
  }

  const totalEl = document.getElementById("bucket-total");
  if (totalEl) totalEl.textContent = `₹${cart.length * PRICE_EACH}`;

  const labelEl = document.getElementById("bucket-count-label");
  if (labelEl) {
    labelEl.textContent = `${cart.length} sheet${cart.length === 1 ? "" : "s"}`;
  }

  // Bind remove buttons
  document.querySelectorAll("[data-remove]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-remove");
      const currentCart = getCart();
      const updatedCart = currentCart.filter(item => item.cartId !== id);
      saveCart(updatedCart);
      renderBucket();
    });
  });
}

// Handle Checkout
function initBucketCheckout() {
  const button = document.getElementById("bucket-checkout");
  if (!button) return;

  button.addEventListener("click", async () => {
    const cart = getCart();
    if (!cart || !cart.length) return;

    button.disabled = true;
    button.textContent = "Preparing payment…";

    try {
      const orderRes = await fetch(`${BACKEND_URL}/api/create-razorpay-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: cart.length })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.orderId) {
        throw new Error(orderData.error || "Could not create order");
      }

      localStorage.setItem("ocFoundryPendingCart", JSON.stringify(cart));

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "OC Foundry",
        description: `${cart.length} Character Bible${cart.length > 1 ? "s" : ""}`,
        order_id: orderData.orderId,
        theme: { color: "#9380c5" },
        handler: async function (response) {
          button.textContent = "Verifying payment…";

          const verifyRes = await fetch(`${BACKEND_URL}/api/verify-razorpay-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature
            })
          });

          const verifyData = await verifyRes.json();
          if (!verifyData.verified) throw new Error("Verification failed");

          // Save paid token & cart for success page
          localStorage.setItem("ocFoundryPaidToken", response.razorpay_payment_id);
          localStorage.setItem("ocFoundryPurchasedCart", JSON.stringify(cart));
          localStorage.removeItem("ocFoundryCart");
          localStorage.removeItem("ocFoundryPendingCart");

          window.location.href = `success.html?payment_id=${response.razorpay_payment_id}&qty=${cart.length}`;
        },
        modal: {
          ondismiss: function () {
            button.disabled = false;
            button.textContent = "Buy all sheets →";
          }
        }
      };

      const rzp = new Razorpay(options);
      rzp.on("payment.failed", function () {
        button.disabled = false;
        button.textContent = "Buy all sheets →";
        alert("Payment failed. Please try again.");
      });
      rzp.open();

    } catch (err) {
      console.error(err);
      button.disabled = false;
      button.textContent = "Buy all sheets →";
      alert("Something went wrong starting checkout. Please try again.");
    }
  });
}

// Initialize on DOM load
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    renderBucket();
    initBucketCheckout();
  });
} else {
  renderBucket();
  initBucketCheckout();
}
