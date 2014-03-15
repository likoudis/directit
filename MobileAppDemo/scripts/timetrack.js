(function (global) {
	app = global.app = global.app || {};
	var TimetrackModel;

	TimetrackModel = kendo.data.ObservableObject.extend({
		timeTrackDataSource : null,
		currentPrjName : null,
		stopRefreshIntervalId : null,
		
		init: function() {
			var that = this,
			dataSource;

			kendo.data.ObservableObject.fn.init.apply(that, []);

			dataSource = new kendo.data.DataSource({
				data: app.prjSSPairs,
				sort: { field: "start", dir: "desc" }
			});

			this.set("timeTrackDataSource", dataSource);
		},

		toHHHmmss: function (t) {
			// This is correct only for less than 24h...
			var h=t.getUTCHours();
			var m=t.getUTCMinutes();
			var s=t.getUTCSeconds();

			h= h>10 ? h : "0" + h;
			m= m<10 ? "0" + m : m;
			s= s<10 ? "0" + s : s;
			return (h+" : "+m+" : "+s);
		},
	
		calculateDuration: function () {
			var today= new Date();
			
			var duration = today.getTime() - app.currentSSPair.start.getTime();
			duration = new Date(duration);
			duration = app.timetrackService.viewModel.toHHHmmss(duration);
			return duration;
		},

		onStart: function() {
			var today= new Date();

			app.dataHandler.addItem(app.prjSSPairs, 
				{listName: "prjSSPairs" + app.currentPrj.id, start: today, stop: "Started..."});
			app.currentSSPair = app.prjSSPairs[app.prjSSPairs.length-1];
			this.timeTrackDataSource.data(app.prjSSPairs);
			this.stopRefreshIntervalId = setInterval(this.refreshStop, 1000);
		},
		
		refreshStop: function () {
		    var that = app.timetrackService.viewModel;
			clearInterval(that.stopRefreshIntervalId);
			
			var duration = app.timetrackService.viewModel.calculateDuration();
			
			that.timeTrackDataSource.at(
				that.timeTrackDataSource.data().length -1 ).stop = duration;
			$("#listview-prjSSPairs").data("kendoMobileListView").refresh();
			that.stopRefreshIntervalId = setInterval(that.refreshStop, 1000);
		},

		onStop: function() {
			clearInterval(this.stopRefreshIntervalId);
			this.stopRefreshIntervalId = null;

			var duration = this.calculateDuration();
			
			app.currentSSPair.stop = duration;
			app.dataHandler.changeItem(app.prjSSPairs, app.currentSSPair);
			this.timeTrackDataSource.data(app.prjSSPairs);
		},

		onDelete: function() {
			if (this.stopRefreshIntervalId !== null) {
				clearInterval(this.stopRefreshIntervalId);
				this.stopRefreshIntervalId = null;
			}
			if (app.currentSSPair !== undefined)
				app.dataHandler.deleteItem(app.prjSSPairs, app.currentSSPair);
			app.currentSSPair = app.prjSSPairs[app.prjSSPairs.length-1];
			this.timeTrackDataSource.data(app.prjSSPairs);
		}
	});

	app.timetrackService = {
		initTimeTrack: function () {
			var that = app.timetrackService.viewModel;
			that.set("currentPrjName", app.currentPrj.name);

			$("#startButton").show();
			$("#stopButton").hide();
		},

        onShow: function () {
		    var that = app.timetrackService.viewModel;
		    
		    if (app.currentSSPair.stop === undefined) { // project changed or first time
				that.timeTrackDataSource.data(app.prjSSPairs);
				$("#startButton").show();
				$("#stopButton").hide();
			}
			if (app.currentSSPair.stop === "Started...")
				that.stopRefreshIntervalId = setInterval(
		        	that.refreshStop, 1000);
		},
		onHide: function () {
		    var that = app.timetrackService.viewModel;
		    
			if (that.stopRefreshIntervalId !== null) {
				clearInterval(that.stopRefreshIntervalId);
				that.stopRefreshIntervalId = null;
			}

		    if (app.currentSSPair.start === undefined) // first time
				return;

			//Provisionally update stop, but current stop == Started...
			//calculate duration
			//update stop in database.
			
			var duration = that.calculateDuration();
			app.currentSSPair.stop = duration;
			app.dataHandler.changeItem(app.prjSSPairs, app.currentSSPair);
			app.currentSSPair.stop = "Started...";
		},
        startClick: function() {
			app.timetrackService.viewModel.onStart();
			$("#startButton").hide();
			$("#stopButton").show();
		},
		stopClick: function() {
			app.timetrackService.viewModel.onStop();
			$("#startButton").show();
			$("#stopButton").hide();
		},
		delClick: function() {
			app.timetrackService.viewModel.onDelete();
			$("#startButton").show();
			$("#stopButton").hide();
		},

		viewModel: new TimetrackModel()
	};

}) (window);