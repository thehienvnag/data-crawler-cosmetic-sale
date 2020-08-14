const puppeteer = require("puppeteer");
const fs = require("fs");

const getLinksOfCategory = () => {
  const linkEles = document.querySelectorAll(".view-all a");
  //5 first item is category based products
  const links = Array.from(linkEles)
    .filter((ele, i) => i <= 4)
    .map((ele) => ele.href);
  return links;
};
const getCategoryDetails = () => {
  const productGrid = document.getElementsByClassName("products-grid")[0];
  const items = productGrid.getElementsByClassName("item");
  const itemArr = Array.from(items);

  const promoDesEle = document.getElementsByClassName("promo-description")[0];
  const categoryName = promoDesEle.getElementsByTagName("h1")[0].innerHTML;
  const categoryDes = promoDesEle.getElementsByClassName("category-des")[0]
    .innerHTML;

  const products = itemArr.map((item) => {
    const link = item
      .getElementsByClassName("product-name")[0]
      .getElementsByTagName("a")[0].href;

    return {
      // Title: name,
      // Price: price
      Name_URL: link,
    };
  });
  return {
    CateName: categoryName,
    CateDes: categoryDes,
    Products: products,
  };
};
const getProductDetails = () => {
  const name = document
    .getElementsByClassName("product-name")[0]
    .getElementsByTagName("h1")[0].innerHTML;
  let description = "";
  const descriptionEle = document.querySelector(".description");
  if (descriptionEle) {
    description = Array.from(descriptionEle.getElementsByTagName("p")).reduce(
      (acc, cur) => {
        return acc + cur.innerHTML.replace("\\ng") + "\n";
      },
      ""
    );
  }

  const regularPrice = document.getElementsByClassName("regular-price")[0];

  let price;
  if (regularPrice) {
    price = regularPrice.getElementsByClassName("price")[0].innerHTML;
  } else {
    price = item
      .getElementsByClassName("special-price")[0]
      .getElementsByClassName("price")[0].innerHTML;
  }
  const imageLink = document.getElementsByClassName(
    "cloud-zoom product-image-gallery"
  )[0].href;
  return {
    Text: description,
    Image: imageLink,
    Price: price.replace(/((?![0-9]).)*/g, "").trim(),
    Title: name,
  };
};

const getProductDetailsAsync = async (page, Name_URL) => {
  await page.goto(Name_URL, { waitUntil: "networkidle2" }).catch((e) => void 0);
  const productDetails = await page.evaluate(getProductDetails);
  return Object.assign(productDetails, { Name_URL: Name_URL });
};

const crawlTourContent = async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();
  const version = await page.browser().version();
  console.log(version);

  await page
    .goto("https://www.thebodyshop.com.vn/vn/", { waitUntil: "networkidle2" })
    .catch((e) => void 0);
  let categories = [];
  try {
    const links = await page.evaluate(getLinksOfCategory);

    for (const link of links) {
      await page.goto(link, { waitUntil: "networkidle2" }).catch((e) => void 0);
      const category = await page.evaluate(getCategoryDetails);
      const products = await Promise.all(
        category.Products.map((pro) =>
          getProductDetailsAsync(page, pro.Name_URL)
        )
      );
      category.Products = products;
      categories.push(category);
    }
  } catch (error) {
    console.log(error);
  }
  console.log(categories);

  writeFile("storage.txt", JSON.stringify(categories));

  await browser.close();
};

const writeFile = (fileName, content, flag = "w") => {
  fs.writeFile(fileName, content, { flag: flag }, (err) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Successfully write file");
    }
  });
};

crawlTourContent();
