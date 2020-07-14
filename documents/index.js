module.exports = ({
   custName,
   custStreet,
   custCityStateZip,
   id,
   date,
   dueDate,
   total,
   lineItemsHTML,
}) => {
   return `
   <!DOCTYPE html>
   <html>
      <head>
         <meta charset="utf-8" />
         <title>PDF Result Template</title>
         <style>
         .container {
            max-width: 750px;
            margin: 40px auto auto auto;
            padding: 30px;
            font-size: 16px;
            line-height: 24px;
            font-family: Arial, Helvetica, sans-serif, 'Helvetica';
            color: black;
          }
          
          #header {
            position: relative;
          }
          
          #header #invoice-bold {
            position: absolute;
            margin-top: 0;
            right: 60px;
            top: 0;
            letter-spacing: 0.5em;
          }
          
          #header #top-stats {
            position: absolute;
            left: 550px;
            top: 90px;
          }
          
          #header #top-total {
            position: absolute;
            right: 300px;
            top: 80px;
          }
          
          table {
            width: 100%;
            text-align: right;
            border-collapse: collapse;
            font-size: large;
            margin-top: 40px;
          }

          table tr {
             height: 40px;
          }
          
          table th {
            background: rgb(175, 175, 175);
            height: 30px;
            padding-left: 5px;
            padding-right: 5px;
          }
          
          table td {
            border-left: 1px solid rgb(175, 175, 175);
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
            border-bottom: 1px solid rgb(175, 175, 175);
          }
          
          #table-total {
            margin-left: auto;
            text-align: right;
            width: 220px;
          }
          
          #table-total span {
            margin-right: 5px;
            display: inline-block;
            width: 100px;
          }
         </style>
      </head>
      <body>
      <div class="container">
         <div id="header">
            <h1 id="company-name">Joe's Landscaping <br /></h1>
            <p id="company-address">
               Joe's Address <br />
               2nd Address line
            </p>
            <h3 id="customer">
               Bill to: <br />
            </h3>
            <p>
               ${custName} <br />
               ${custStreet} <br />
               ${custCityStateZip}
            </p>
            <h1 id="invoice-bold">INVOICE</h1>
            <div id="top-stats">
               <p>
                  Invoice: ${id} <br />
                  Date: ${date} <br />
                  Due: ${dueDate}
               </p>
            </div>
            <h2 id="top-total">Total Due: $${total}</h2>
         </div>
         <table id="">
            <tr id="heading">
               <th>Description</th>
               <th>Quantity</th>
               <th>Unit Price</th>
               <th>Total Price</th>
            </tr>
            ${lineItemsHTML}
            <!-- <tr class="items">
               <td>Test Item</td>
               <td>1</td>
               <td>$50.00</td>
               <td>$50.00</td>
            </tr>
            <tr class="items">
               <td>Second item</td>
               <td>3</td>
               <td>$100.00</td>
               <td>$300.00</td>
            </tr> -->
         </table>
         <div id="table-total">
            <span>Total:</span>
            <span>$${total}</span>
         </div>
      </div>
      </body>
   </html>
    `
}
