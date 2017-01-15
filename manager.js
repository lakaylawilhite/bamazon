var inquirer = require('inquirer');
var mysql = require('mysql');
var Table = require('cli-table');

var connection = mysql.createConnection({
    host: "localhost",
    port: 3306,
    user: "root", //Your username
    password: "password", //Your password
    database: "Bamazon_db"
})



var managerPrompt = function() {
    inquirer.prompt({
        name: "action",
        type: "list",
        message: "Hello! What would you like to do?",
        choices: ["View products for sale", 'View low inventory', "Add to inventory", "Add a new product", 'Exit']
    }).then(function(answer) {
        switch (answer.action) {
            case 'View products for sale':
                viewInven(function() {
                    managerPrompt();
                });
                break;

            case 'View low inventory':
                viewLowInven(function() {
                    managerPrompt();
                });
                break;

            case 'Add to inventory':
                addToInven();
                break;

            case 'Add a new product':
                addNewProd();
                break;
                
            case 'Exit':
                connection.end();
                break;
        }
    })
};


var viewInven = function(cb) {
    connection.query('SELECT * FROM products', function(err, res) {
        
        var table = new Table({
            head: ['ID', 'Product Name', 'Department', 'Price', 'Stock Quantity']
        });
        console.log("HERE ARE ALL THE ITEMS AVAILABLE FOR SALE: ");
        console.log("===========================================");
        for (var i = 0; i < res.length; i++) {
            table.push([res[i].id, res[i].ProductName, res[i].DepartmentName, res[i].Price, res[i].StockQuantity]);
        }
        
        console.log(table.toString());
        console.log("-----------------------------------------------");
        cb();
    })
}

function viewLowInven(cb) {
    connection.query('SELECT * FROM products WHERE StockQuantity < 5',
        function(err, res) {
            if (err) throw err;
           
            if (res.length === 0) {
                console.log("There are currently no items with Low Inventory!")
                cb();
            } else {
                
                var table = new Table({
                    head: ['ID', 'Product Name', 'Department', 'Price', 'Stock Quantity']
                });
                for (var i = 0; i < res.length; i++) {
                    table.push([res[i].id, res[i].ProductName, res[i].DepartmentName, res[i].Price, res[i].StockQuantity]);
                }
                
                console.log(table.toString());
                console.log('These are all the items that are low on inventory.')
                cb();
            }
        });
}



function addToInven() {
    var items = [];
   
    connection.query('SELECT ProductName FROM Products', function(err, res) {
        if (err) throw err;
        
        for (var i = 0; i < res.length; i++) {
            items.push(res[i].ProductName)
        }
        
        inquirer.prompt([{
            name: 'choices',
            type: 'checkbox',
            message: 'Which product would you like to add inventory for?',
            choices: items
        }]).then(function(user) {
           
            if (user.choices.length === 0) {
                console.log('Oops! You didn\'t select anything!');
                managerPrompt();
            } else {

                addToInven2(user.choices);

            }
        });
    });
}


//this is taking forever
function addToInven2(itemNames) {
    //literally code is a migraine
    var item = itemNames.shift();
    var itemStock;
  
    connection.query('SELECT StockQuantity FROM products WHERE ?', {
        ProductName: item
    }, function(err, res) {
        if (err) throw err;
        itemStock = res[0].StockQuantity;
        itemStock = parseInt(itemStock)
    });
   
    inquirer.prompt([{
        name: 'amount',
        type: 'text',
        message: 'How many ' + item + ,
       
        validate: function(str) {
            if (isNaN(parseInt(str))) {
                console.log('Sorry that is not a valid number!');
                return false;
            } else {
                return true;
            }
        }
    }]).then(function(user) {
        var amount = user.amount
        amount = parseInt(amount);
       
        connection.query('UPDATE products SET ? WHERE ?', [{
            StockQuantity: itemStock += amount
        }, {
            ProductName: item
        }], function(err) {
            if (err) throw err;
        });
    
        if (itemNames.length != 0) {
            addToInven2(itemNames);
        } else {
           
            console.log('Thank you, Your inventory has been updated.');
            managerPrompt();
        }
    });
}

function addNewProd() {
    var departments = [];
    
    connection.query('SELECT DepartmentName FROM Departments', function(err, res) {
        if (err) throw err;
        for (var i = 0; i < res.length; i++) {
            departments.push(res[i].DepartmentName);
        }
    });
    inquirer.prompt([{
        name: 'item',
        type: 'text',
        message: 'enter the name of the product .'
    }, {
        name: 'department',
        type: 'list',
        message: ' choose a department for your product',
        name: 'price',
        type: 'text',
        message: 'Pick a price for this item.'
    }, {
        name: 'stock',
        type: 'text',
        message: ' enter the Stock Quantity for this item '
    }]).then(function(user) {
        
        var item = {
                ProductName: user.item,
                DepartmentName: user.department,
                Price: user.price,
                StockQuantity: user.stock
            }
            
        connection.query('INSERT INTO Products SET ?', item,
            function(err) {
                if (err) throw err;
                console.log(item.ProductName + ' has been added successfully to your inventory.');
                //THE MANAGER PROMPT FUNCTION IS RUN AGAIN.
                managerPrompt();
            });
    });
}






managerPrompt();
