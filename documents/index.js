module.exports = ({
   companyName,
   companyInfo,
   custName,
   custStreet,
   custCityStateZip,
   id,
   date,
   dueDate,
   owed,
   payments,
   total,
   lineItemsHTML
}) => {
   return `
   <!DOCTYPE html>
   <html>
      <head>
         <meta charset="utf-8" />
         <title>Invoice</title>
         <style>
         .container {
            max-width: 750px;
            margin: 60px auto auto auto;
            padding: 30px;
            font-size: 16px;
            line-height: 24px;
            font-family: Arial, Helvetica, sans-serif, 'Helvetica';
            color: black;
          }
          
          #header {
            position: relative;
            min-height: 200px;
          }
          
          #header #invoice-bold {
            position: absolute;
            margin-top: 0;
            right: 0px;
            top: 0;
            letter-spacing: 0.5em;
            color: rgb(20, 136, 230);
          }
          
          #header #top-stats {
            position: absolute;
            left: 550px;
            top: 30px;
            font-size: large;
          }
          #header #top-stats #left {
             position: relative;
             top: 0;
             right: 60px;
             text-align: right;
          }

          #header #top-stats #right {
            position: absolute;
            top: 0;
            left: 60px;
          }

          .total-due {
            font-size: x-large;
          }
          
          table {
            position: relative;
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
            background: rgb(20, 136, 230);
            color: white;
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
            font-size: large;
          }
          
          #table-total span {
            margin-top: 10px;
            margin-right: 5px;
            display: inline-block;
            width: 100px;
          }
         </style>
      </head>
      <body>
      <div class="container">
         <div id="header">
            <h1 id="company-name">${companyName}<br /></h1>
            <p id="company-address">
               ${companyInfo}
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
               <div id="left">
                  <p>
                     Invoice: <br />
                  </p>
                  <p>
                     Date: <br />
                  </p>
                  <p>
                     Due: <br />
                  </p>
                  <p class="total-due">
                     Total Due: 
                  </p>
               </div>
               <div id="right">
                  <p>
                     ${id} <br />
                  </p>
                  <p>
                     ${date} <br />
                  </p>
                  <p>
                     ${dueDate} <br />
                  </p>
                  <p class="total-due">
                     $${owed}
                  </p>
               </div>
               
            </div>

         </div>
         <table>
            <tr id="heading">
               <th>Description</th>
               <th>Quantity</th>
               <th>Unit Price</th>
               <th>Total Price</th>
            </tr>
            ${lineItemsHTML}
         </table>
         <div id="table-total">
            <span>Total:</span>
            <span>$${total}</span>
            <span>Payments:</span>
            <span>-$${payments}</span>
            <span>Due:</span>
            <span>$${owed}</span>
         </div>
      </div>
      </body>
   </html>
    `
}
