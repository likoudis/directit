(function (global) {
	var app = global.app = global.app || {};
/*	
	var taskPrj =  {
		id: "",
		listName: "projects",
		name: ""
	};
	var startStopPair = {
		id: "",
		listName: "prjSSPairs",
		start: "",
		stop: "",
	};
*/
// app-wide available variables
	app.projects = [];
	app.prjSSPairs = [];
	app.currentPrj = "app";
	
	app.currentSSPair = {};

	app.dataHandler = {
		init: function() {
			localStorage["projects"] = JSON.stringify([
				{"id": 0, "listName": "projects", "name": "Project1"},
				{"id": 1, "listName": "projects", "name": "Task23"},
				{"id": 2, "listName": "projects", "name": "Task22"},
				{"id": 3, "listName": "projects", "name": "Task21"}
			]);
			app.projects = JSON.parse(localStorage["projects"]);
			app.currentPrj = app.projects[app.projects.length - 1];

			localStorage["prjSSPairs" + app.currentPrj.id] = JSON.stringify([]);
			app.prjSSPairs = JSON.parse(localStorage["prjSSPairs" + app.currentPrj.id]);
			//app.currentSSPair = app.prjSSPairs[2];
		},

		findPrjByName: function (prjName) {
			var i, l;
			for(i=0, l=app.projects.length; i<l; i++)
				if (app.projects[i].name === prjName)
					break;
			return (i===l) ? null : app.projects[i];
        },
		setCurrentPrj: function (newProjectName) {
			var l = app.projects.length;
			
			app.currentPrj = this.findPrjByName(newProjectName);
			if (app.currentPrj === null) {
				app.currentPrj = this.addItem(app.projects, {id: l, listName: "projects", name: newProjectName});
            }

			if (localStorage["prjSSPairs" + app.currentPrj.id] === undefined) 
				localStorage["prjSSPairs" + app.currentPrj.id] = JSON.stringify([]);

			app.prjSSPairs = JSON.parse(localStorage["prjSSPairs" + app.currentPrj.id]);
			for (var i=0; i<app.prjSSPairs.length; i++) {
				t = new Date(JSON.parse(JSON.stringify(app.prjSSPairs[i].start)));
				app.prjSSPairs[i].start = t;
            }

//Signal that the project has changed.
			app.currentSSPair.stop = undefined;

			return (app.currentPrj.name);
		},

		editPrjList: function (o) {
			var prjNameInput = app.taskPrjService.viewModel.currentPrjName;
		},

		addItem:    function(localArray, item) {
			localArray.push(item);
			var itemListName = item.listName;
			localArray[localArray.length - 1].id = localArray.length - 1;
			localStorage[itemListName] = JSON.stringify(localArray);
			return item;
		},
		changeItem: function(localArray, item) {
			var itemListName = item.listName;
			localArray.splice(item.id, 1, item);
			localStorage[itemListName] = JSON.stringify(localArray);
		},
		deleteItem: function(localArray, item) {
			var itemListName = item.listName;
			localArray.splice(item.id, 1);
			localStorage[itemListName] = JSON.stringify(localArray);
		}
	}
}) (window);