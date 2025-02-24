const itemsPerPage = 8;
const modelPath = "../model";
let listCategoryIds = [];
let priceRange = null;
let keyword = null;

// Hàm để render HTML của mỗi sản phẩm
function renderProductHTML(data) {
  let productHTML = '<div class="collection-product-list">';

  data.products.forEach((product) => {
    const formatPrice = parseInt(product.price).toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
    });

    let notAllowed = "";
    if (product.quantity <= 0) {
      notAllowed = "notAllowed";
    }
    productHTML += `
      <div class="product-item--wrapper">
        <div class="product-item">
          <div class="product-img">
            <div class="product-action">
              <div class="product-action--wrapper">
                <a href="index.php?page=product_detail&pid=${
                  product.id || product.product_id
                }" class="product-action--btn product-action__detail">Chi tiết</a>
                <input type="hidden" class="productId" value="${
                  product.id || product.product_id
                }"/>
                <button class="product-action--btn product-action__addToCart ${notAllowed}">Thêm vào giỏ</button>
              </div>
            </div>
            <div class="img-resize">
              <img
                src="${product.image_path}"
                alt="${product.product_name || product.name}" />
            </div>
          </div>
          <a href="index.php?page=product_detail&pid=${
            product.id || product.product_id
          }" >
            <div class="product-detail">
                <p class="product-title">${
                  product.name || product.product_name
                }</p>
                <p class="product-price">${formatPrice}</p>
            </div>
          </a>
        </div>
      </div>`;
  });
  productHTML += "</div>";
  return productHTML;
}

// Hàm để render HTML của phân trang
function renderPaginationHTML(data, itemsPerPage) {
  let paginationHTML = '<div class="pagination">';
  const totalPage = Math.ceil(data.amountProduct / itemsPerPage);

  if (data.page > 1) {
    const prev = data.page - 1;
    paginationHTML += `
      <button class="pagination-btn" data="${prev}">
        <i class="fa-solid fa-angle-left"></i>
      </button>`;
  }

  if (data.page - 3 >= 1) {
    paginationHTML += '<button class="pagination-btn" data="1">1</button>';
    paginationHTML += "...";
  }

  for (let i = 1; i <= totalPage; i++) {
    const isActive = data.page === i ? "active" : "";
    if (i < data.page + 3 && i > data.page - 3) {
      paginationHTML += `<button class="pagination-btn ${isActive}" data="${i}">${i}</button>`;
    }
  }

  if (data.page + 3 <= totalPage) {
    paginationHTML += "...";
    paginationHTML += `<button class="pagination-btn" data="${totalPage}">${totalPage}</button>`;
  }

  if (data.page < totalPage) {
    const next = data.page + 1;
    paginationHTML += `
      <button class="pagination-btn" data="${next}">
        <i class="fa-solid fa-angle-right"></i>
      </button>`;
  }

  paginationHTML += "</div>";
  return paginationHTML;
}

// Hàm để render dữ liệu sản phẩm và phân trang (AJAX)
function renderProductsPerPage(
  currentPage,
  listCategoryIds = null,
  priceRange = null,
  keyword = null
) {
  $.ajax({
    url: "controller/product.controller.php",
    type: "post",
    dataType: "html",
    data: {
      listCategoryIds,
      priceRange,
      itemsPerPage,
      currentPage,
      keyword,
      modelPath,
    },
  }).done(function (result) {
    const data = JSON.parse(result);
    try {
      if (data.success) {
        const productHTML = renderProductHTML(data);
        const paginationHTML = renderPaginationHTML(data, itemsPerPage);
        let html = `${productHTML}${paginationHTML}`;
        $(".result").html(html);
      } else {
        $(".result").html(data.message);
      }
    } catch (error) {
      $(".result").html("Không tìm thấy sản phẩm");
    }
  });
}

$(document).ready(function () {
  // Tự load sản phẩm ở lần đầu vào trang
  if (!localStorage.getItem("keyword")) {
    renderProductsPerPage(1);
  }

  // Sử dụng Event Delegation cho các nút phân trang
  $(document).on("click", ".pagination-btn", function () {
    $(".pagination-btn").removeClass("active");
    $(this).addClass("active");

    var current_page = $(this).attr("data");
    renderProductsPerPage(current_page, listCategoryIds, priceRange, keyword);
  });

  if (localStorage.getItem("keyword")) {
    keyword = localStorage.getItem("keyword");
    renderProductsPerPage(1, listCategoryIds, priceRange, keyword);
  }

  // Xử lý click nút search
  if (localStorage.getItem("keyword")) {
    keyword = localStorage.getItem("keyword");
    renderProductsPerPage(1, listCategoryIds, priceRange, keyword);
    resetFilter();
    document.querySelector("#searchInput").value = keyword;
    // // Xoá localStorage khi bấm nút search lưu
    // localStorage.removeItem("keyword");
  } else {
    keyword = document.querySelector("#searchInput").value;
    $("#searchButton").click(function () {
      renderProductsPerPage(1, listCategoryIds, priceRange, keyword);
      resetFilter();
    });
  }

  // Lọc nâng cao theo thể loại
  $('input[name="theloai"]').click(function () {
    // Nếu click vào mà ckb.selected = true thì add vào mảng
    // Ngược lại thì bỏ khỏi mảng
    const categoryIdData = $(this).attr("data");
    if ($(this).is(":checked")) {
      listCategoryIds.push(+categoryIdData);
    } else {
      listCategoryIds = listCategoryIds.filter(
        (categoryId) => categoryId != categoryIdData
      );
    }

    // Tự load sản phẩm ở lần đầu vào trang
    renderProductsPerPage(1, listCategoryIds, priceRange, keyword);
  });

  // Lọc nâng cao theo giá tiền
  $('input[name="giaban"]').click(function () {
    priceRange = $(this).attr("data");

    if ($(this).attr("checked")) {
      $(this).removeAttr("checked");
      priceRange = null;
    } else {
      $(this).attr("checked", true);
      uncheckPriceRange($(this)[0]);
    }

    renderProductsPerPage(1, listCategoryIds, priceRange, keyword);
  });

  // Xử lý add to Cart
  $(document).on("click", ".product-action__addToCart", function (e) {
    e.preventDefault();

    if ($(this).hasClass("notAllowed")) {
      return;
    }

    const productId = $(this)
      .closest(".product-item")
      .find(".productId")[0]
      .getAttribute("value");
    addToCart(productId, 1);
  });
});

// Xử lý reset lọc
function resetFilter() {
  const ckbs = document.querySelectorAll(
    '.sidebar-item__list li input[type="checkbox"]'
  );
  ckbs.forEach((ckb) => {
    if (ckb.checked) {
      ckb.checked = false;
    }
  });
}

function uncheckPriceRange(currentCkb) {
  const ckbs = document.querySelectorAll(
    '.sidebar-item__list li input[type="checkbox"][name="giaban"]'
  );

  ckbs.forEach((ckb) => {
    if (ckb != currentCkb) {
      ckb.checked = false;
      ckb.removeAttribute("checked");
    }
  });
}

// Function xử lý addToCart
function addToCart(productId, amount) {
  $.ajax({
    type: "post",
    url: "controller/cart.controller.php",
    dataType: "html",
    data: {
      "product-action__addToCart": true,
      productId: productId,
      amount: amount,
    },
  }).done(function (result) {
    let data = JSON.parse(result);
    if (!data.success) {
      window.location.href = "index.php?page=signup";
      alert("Vui lòng đăng nhập để có thể thêm sản phẩm!");
      return;
    }
    $(".cart-qnt").removeClass("hide");
    $(".cart-qnt").text(data.quantity);
    alert(data.message);
  });
}
