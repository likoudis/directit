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
			clearInterval(this.stopRefreshIntervalId);
			var today= new Date();
			
			var duration = today.getTime() - app.currentSSPair.start.getTime();
			duration = new Date(duration);
			duration = app.timetrackService.viewModel.toHHHmmss(duration);
			
			duration = app.timetrackService.viewModel.calculateDuration();
			
			app.timetrackService.viewModel.timeTrackDataSource.at(
				app.timetrackService.viewModel.timeTrackDataSource.data().length -1 ).stop = duration;
			$("#listview-prjSSPairs").data("kendoMobileListView").refresh()
			this.stopRefreshIntervalId = setInterval(this.refreshStop, 1000);
		},

		onStop: function() {
			clearInterval(this.stopRefreshIntervalId);
			this.stopRefreshIntervalId = null;
			var today= new Date();
			
			var duration = today.getTime() - app.currentSSPair.start.getTime();
			duration = new Date(duration);
			duration = app.timetrackService.viewModel.toHHHmmss(duration);

			app.currentSSPair.stop = this.calculateDuration();
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
		},
	});

	app.timetrackService = {
		initTimeTrack: function () {
			var that = app.timetrackService.viewModel;
			that.set("currentPrjName", app.currentPrj.name);

			$("#startButton").show();
			$("#stopButton").hide();
		},
		onShow: function () {
			app.timetrackService.viewModel.timeTrackDataSource.data(app.prjSSPairs);
			if (app.currentSSPair === app.prjSSPairs[app.prjSSPairs.length-1])
				return;
			$("#startButton").show();
			$("#stopButton").hide();
		},
		onHide: function () {
			if (app.timetrackService.viewModel.stopRefreshIntervalId === null)
			    return;
			//app.timetrackService.viewModel.onStop();
			//calculate duration
			//
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