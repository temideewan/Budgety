//Budget controller
//BUDGET CONTROLLER
var budgetController = (function () {
	// first we create  function constructors for the income and expenses
	var Expense = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
		this.percentage = -1;
	};

	Expense.prototype.calcPercentage = function (totalIncome) {
		if (totalIncome > 0) {
			this.percentage = Math.round((this.value / totalIncome) * 100);
		} else {
			this.percentage = -1;
		}
	};

	Expense.prototype.getPercentage = function () {
		return this.percentage;
	};

	var Income = function (id, description, value) {
		this.id = id;
		this.description = description;
		this.value = value;
	};

	//create a data structure that is suitable
	var data = {
		allItems: {
			exp: [],
			inc: []
		},
		totals: {
			exp: 0,
			inc: 0
		},
		budget: 0,
		percentage: -1
	};

	//calculate the total by looping over the appropriate array and storing the sum of values in the data structure
	var calculateTotal = function (type) {
		var sum = 0;
		data.allItems[type].forEach(function (cur) {
			sum += cur.value;
		});
		data.totals[type] = sum;
	};

	// then return an object that contains different methods that manipulate the data and update our data structure
	return {
		// first method adds a new item given the type description and value of the new item
		addItem: function (type, des, val) {
			var id, newItem;

			//create new id by checking first if the array is not empty
			if (data.allItems[type].length > 0) {
				id = data.allItems[type][data.allItems[type].length - 1].id + 1;
			} else {
				id = 0;
			}

			if (type === 'exp') {
				// then create a new item based on which particular type i.e inc or exp
				newItem = new Expense(id, des, val);
			} else if (type === 'inc') {
				newItem = new Income(id, des, val);
			}

			//push it into the data structure
			data.allItems[type].push(newItem);

			//return the particular item
			return newItem;
		},

		/* for the delete function 
			we make sure to get the original item array for the corresponding type
			then we map the id of each item into a new array. after this is done
			we get the index of the item that we want to delete by checking through the array 
			to make sure it is present using the indexOf method. this then returns the position 
			the item is on the array and then we remove it using the array.splice method provided 
			it is present in the array
		*/

		deleteItem: function (type, id) {
			var ids, index;
			// loop over all the elements and then get the id
			ids = data.allItems[type].map(function (current) {
				return current.id;
			});

			index = ids.indexOf(id);

			if (index !== -1) {
				data.allItems[type].splice(index, 1);
			}
		},
		// budget calculator for each new item that is added
		calculateBudget: function () {
			//calculate total income and expenses
			calculateTotal('exp');
			calculateTotal('inc');

			//calculate budget = income - expenses
			data.budget = data.totals.inc - data.totals.exp;

			//calculate the percentage of income spent
			if (data.totals.inc > 0) {
				data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
			} else {
				data.percentage = -1;
			}
		},

		calculatePercentages: function () {
			/* 
			a= 20
			b = 30
			c = 40
			totalincome = 100
			a = (20/100) * 100 = 20%
			b = (30/100) * 100 = 30%
			c = (40/100) * 100 = 40%
			*/

			data.allItems.exp.forEach(function (cur) {
				cur.calcPercentage(data.totals.inc);
			});
		},

		getPercentages: function () {
			var allPercentages = data.allItems.exp.map(function (cur) {
				return cur.getPercentage();
			});

			return allPercentages;
		},

		// make the budget calculations available publicly
		getBudget: function () {
			return {
				budget: data.budget,
				totalInc: data.totals.inc,
				totalExp: data.totals.exp,
				percentage: data.percentage
			};
		}
	};
})();

//UI CONTROLLER
/* 
This Unit is in charge of everything related with updating the user interface by means of 
DOM manipulation
*/
var UIController = (function () {
	/* we create a unique location where all the dom strings related with the HTML is stored and then accessed throughout 
    this particular UI module
  */

	var DOMStrings = {
		inputType: '.add__type',
		inputDescription: '.add__description',
		inputValue: '.add__value',
		inputBtn: '.add__btn',
		incomeContainer: '.income__list',
		expensesContainer: '.expenses__list',
		budgetLabel: '.budget__value',
		incomeLabel: '.budget__income--value',
		expenseLabel: '.budget__expenses--value',
		percentageLabel: '.budget__expenses--percentage',
		container: '.container',
		expensesPercentageLabel: '.item__percentage',
		dateLabel: '.budget__title--month'
	};
	var formatNumber = function (num, type) {
		var numSplit, int, dec, type;
		/* + or - before the number 
				exactly two decimal points
				comma separating the thousands

				2310.4567 -> + 2,310.46
				2000 -> + 2,000.00
			*/

		num = Math.abs(num);
		num = num.toFixed(2); // this returns a string i.e 200.toFixed(2) = "200.00"

		numSplit = num.split('.');
		int = numSplit[0];

		if (int.length > 6) {
			int =
				int.substr(0, int.length - 6) +
				',' +
				int.substr(1, int.length - 4) +
				',' +
				int.substr(4, 3); // 123456 -> 1
		} else if (int.length > 3) {
			int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, 3); // 23510 -> 23,510
		}

		dec = numSplit[1];

		return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
	};

	var nodeListForEach = function (list, callback) {
		for (var i = 0; i < list.length; i++) {
			callback(list[i], i);
		}
	};

	return {
		getInput: function () {
			return {
				type: document.querySelector(DOMStrings.inputType).value, //gets either inc or ex
				description: document.querySelector(DOMStrings.inputDescription).value,
				value: parseFloat(document.querySelector(DOMStrings.inputValue).value) // convert the value to numeric value so we can perform calculatiions
			};
		},
		addListItem: function (obj, type) {
			var html, newHtml, element;
			//create HTML string with placeholder text
			if (type === 'inc') {
				element = DOMStrings.incomeContainer;
				html =
					'<div class="item clearfix" id="inc-%id%"><divclass="item__description">%description%</divclass="item__description"><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
			} else if (type === 'exp') {
				element = DOMStrings.expensesContainer;
				html =
					'<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i>	</button></div></div></div>';
			}

			//replace placeholder text with some actual data
			newHtml = html.replace('%id%', obj.id);
			newHtml = newHtml.replace('%description%', obj.description);
			newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

			//insert HTML into the DOM
			document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
		},

		deleteListItem: function (selectorId) {
			var element = document.getElementById(selectorId);
			element.parentNode.removeChild(element);
		},

		clearFields: function () {
			var fields, fieldsArr;

			fields = document.querySelectorAll(
				DOMStrings.inputDescription + ', ' + DOMStrings.inputValue
			);

			// convert the Nodelist into an array by binding it to an array prototype method that returns an array
			fieldsArr = Array.prototype.slice.call(fields);
			fieldsArr.forEach(function (current) {
				current.value = '';
			});
			fieldsArr[0].focus(); //set focus back to the input field
		},

		displayBudget: function (obj) {
			var type;
			obj.budget > 0 ? (type = 'inc') : (type = 'exp');
			document.querySelector(DOMStrings.budgetLabel).textContent = formatNumber(
				obj.budget,
				type
			);
			document.querySelector(DOMStrings.incomeLabel).textContent = formatNumber(
				obj.totalInc,
				'inc'
			);
			document.querySelector(
				DOMStrings.expenseLabel
			).textContent = formatNumber(obj.totalExp, 'exp');

			if (obj.percentage > 0) {
				document.querySelector(DOMStrings.percentageLabel).textContent =
					obj.percentage + '%';
			} else {
				document.querySelector(DOMStrings.percentageLabel).textContent = '---';
			}
		},
		displayPercentages: function (percentages) {
			var fields;
			fields = document.querySelectorAll(DOMStrings.expensesPercentageLabel);

			nodeListForEach(fields, function (current, index) {
				if (percentages[index] > 0) {
					current.textContent = percentages[index] + '%';
				} else {
					current.textContent = '---';
				}
			});
		},

		displayMonth: function () {
			var now, year, month, months;
			now = new Date();

			months = [
				'January',
				'February',
				'March',
				'April',
				'May',
				'June',
				'July',
				'August',
				'September',
				'October',
				'November',
				'December'
			];
			month = now.getMonth();
			year = now.getFullYear();
			document.querySelector(DOMStrings.dateLabel).textContent =
				months[month] + ' ' + year;
		},

		changedType: function () {
			var fields = document.querySelectorAll(
				DOMStrings.inputType +
					', ' +
					DOMStrings.inputDescription +
					',' +
					DOMStrings.inputValue
			);

			nodeListForEach(fields, function (cur) {
				cur.classList.toggle('red-focus');
			});

			document.querySelector(DOMStrings.inputBtn).classList.toggle('red');
		},
		getDOMStrings: function () {
			return DOMStrings;
		}
	};
})();
//App controller
var controller = (function (budgetCtrl, UICtrl) {
	var setupEventListeners = function () {
		var DOM = UICtrl.getDOMStrings();
		document.querySelector(DOM.inputBtn).addEventListener('click', ctrlAddItem);

		document.addEventListener('keypress', function (event) {
			if (event.keyCode === 13 || event.which === 13) {
				ctrlAddItem();
			}
		});

		/* Using the concept of event delegation we addd an event listener
			to the parent of the element we want to target. This works
			because of event bubbling
		*/
		document
			.querySelector(DOM.container)
			.addEventListener('click', ctrlDeleteItem);
		document
			.querySelector(DOM.inputType)
			.addEventListener('change', UICtrl.changedType);
	};

	var updateBudget = function () {
		//1. Calculate the budget
		budgetCtrl.calculateBudget();

		//2. Return the budget
		var budget = budgetCtrl.getBudget();

		//3. Display the budget on the UI
		UICtrl.displayBudget(budget);
	};

	var updatePercentages = function () {
		// 1. calculate the percentages
		budgetCtrl.calculatePercentages();
		// 2. Read percentages from budget
		var percentages = budgetCtrl.getPercentages();
		// 3. Update the UI with the current percentages
		UICtrl.displayPercentages(percentages);
	};

	var ctrlAddItem = function () {
		var input, newItem;

		// 1. Get the filled input data
		input = UICtrl.getInput();

		// do the remaining only if there is  a valid value in the input fields i.e not empty
		if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
			//2. Add item to the budget controller
			newItem = budgetCtrl.addItem(input.type, input.description, input.value);

			//3. Add the item to the user interface
			UICtrl.addListItem(newItem, input.type);

			//4. Clear the fields
			UICtrl.clearFields();

			//5. Calculate and update budget
			updateBudget();

			// 6. calculate and update percentages
			updatePercentages();
		}
	};

	var ctrlDeleteItem = function (e) {
		var itemId, splitId, type, ID;

		// Dom traversing until we get to the particular parent element that we are interested in
		itemId = e.target.parentNode.parentNode.parentNode.parentNode.id;

		if (itemId) {
			splitId = itemId.split('-');
			type = splitId[0];
			ID = parseInt(splitId[1]);

			// 1. delete the item from the data structure
			budgetCtrl.deleteItem(type, ID);

			// 2. Delete the item from UI
			UICtrl.deleteListItem(itemId);

			// 3. Update and show the new Budget
			updateBudget();

			// 4. calculate and update percentages
			updatePercentages();
		}
	};

	return {
		init: function () {
			console.log('Application is starting');
			UICtrl.displayMonth();
			UICtrl.displayBudget({
				budget: 0,
				totalInc: 0,
				totalExp: 0,
				percentage: -1
			});
			setupEventListeners();
		}
	};
})(budgetController, UIController);

controller.init();
