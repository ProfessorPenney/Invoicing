module.exports = ({ name, id, date, total, lineItemsHTML }) => {
	// const today = new Date()
	return `
   <!DOCTYPE html>
   <html>
      <head>
         <meta charset="utf-8" />
         <title>PDF Result Template</title>
         <style>
         .container {
            max-width: 900px;
            margin: auto;
            padding: 30px;
            border: 1px solid #eee;
            font-size: 16px;
            line-height: 24px;
            font-family: Arial, Helvetica, sans-serif, 'Helvetica';
            color: #555;
          }
          #Header {
            display: -ms-grid;
            display: grid;
          }
          .justify-center {
            text-align: center;
          }
          table {
            width: 100%;
            text-align: right;
            border-collapse: collapse;
          }
          table th {
            background: #eee;
            height: 30px;
            padding-left: 5px;
            padding-right: 5px;
          }
          table td {
            border-left: 1px solid #ddd;
            padding-left: 5px;
            padding-right: 5px;
          }
          table tr :first-child {
            border-left: none;
            text-align: left;
          }
          table tr :nth-child(2) {
            width: 50px;
          }
          table tr :nth-child(3) {
            width: 100px;
          }
          table tr :nth-child(4) {
            width: 100px;
          }
          table tr * {
            border-bottom: 1px solid #ddd;
          }
         </style>
      </head>
      <body>
      <div class="container">
      <div id="header">
         <h3>Joe's Landscaping</h3>
         <h5>
            Date: ${date}
         </h5>
         <h5>
            Customer name: ${name} Customer Address
         </h5>
         <h5>
            Invoice number: ${id}
         </h5>
         <h4>Total price: $ ${total}</h4>
      </div>
      <table id="">
         <tr id="heading">
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total Price</th>
         </tr>
         <!-- <tr class="items">
            <td>First item</td>
            <td>First Qty</td>
            <td>First Unit</td>
            <td>$100</td>
         </tr>
         <tr class="items">
            <td>Second item</td>
            <td>Second Qty</td>
            <td>Second Unit</td>
            <td>$50</td>
         </tr> -->
         ${lineItemsHTML}

      </table>
      <br />
      <h1 class="justify-center">
         Total price: $ ${total}
      </h1>
   </div>
      </body>
   </html>
    `
}
