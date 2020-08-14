const fs = require("fs");
const main = () => {
  const categories = JSON.parse(fs.readFileSync("storage.txt"));

  const initial = `
      DECLARE @id int
      DECLARE @table table (id int)
  \n`;

  const stm = categories.reduce((acc, { CateName, CateDesc, Products }) => {
    let insertStm = generateCategoryInsert(CateName, CateDesc);
    insertStm += Products.reduce(
      (acc, { Price, Text, Title, Image }) =>
        acc + generateProductInsert(Price, Text, Title, Image),
      ""
    );
    return acc + insertStm;
  }, initial);

  writeFile("SQL_statements.txt", stm);
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

const generateCategoryInsert = (name, desc) => `
          INSERT INTO [dbo].[Category] ([Name],[Description]) 
          OUTPUT inserted.ID INTO @table VALUES(N'${name}','${desc}')
          SELECT TOP 1 @id = id FROM @table ORDER BY id DESC
\n`;

const generateProductInsert = (price, usage, name, image, statusId = 1) => {
  const quantity = Math.floor(Math.random() * (50 - 17 + 1) + 17);
  return `INSERT INTO [dbo].[Product] 
          (Name,Quantity, Price, ImageLink, StatusID, CateID, Usage) 
          VALUES(N'${name}',${quantity},${price}, '${image}', 1, @id, N'${usage}') 
  \n`;
};

main();
