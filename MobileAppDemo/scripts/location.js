(function (global) {
	var map,
		geocoder,
		LocationViewModel,
		app = global.app = global.app || {};

	LocationViewModel = kendo.data.ObservableObject.extend({
		_lastMarker: null,
		_isLoading: false,

		address: "",
		isGoogleMapsInitialized: false,
		permitsTodayDataSource: null,
		mapMarkers: [],
		
		inspectionAddressOnMap : function (e) {
			return e.isOnMap;
		},

		init: function () {
			var that = this,
			dataSource;

			kendo.data.ObservableObject.fn.init.apply(that, []);

			dataSource = new kendo.data.DataSource({
				data: [
					{id: 0, lat:00, lng:05, address: "address1", isOnMap: false},
					{id: 1, lat:10, lng:15, address: "address2", isOnMap: false},
					{id: 2, lat:20, lng:25, address: "address3", isOnMap: false},
					{id: 3, lat:30, lng:35, address: "address4", isOnMap: false},
					{id: 4, lat:40, lng:45, address: "address5", isOnMap: false},
					{id: 5, lat:50, lng:55, address: "address6", isOnMap: false}
				]
			});

			this.set("permitsTodayDataSource", dataSource);
		},

		onInspectionSelect: function (e) {
			e.data.isOnMap = !e.data.isOnMap;
			$("#listview-permitsToday").data("kendoMobileListView").refresh();

			var minLat = 90;
			var maxLat = -90;
			var minLng = 180;
			var maxLng = -180;
			var that = this;

			if (e.data.isOnMap) { // Just added one
				for (var i=0; i < that.permitsTodayDataSource.data().length; i++) {
					var t=that.permitsTodayDataSource.at(i);
					if (t.isOnMap) {
						if(t.lat < minLat) minLat = t.lat
						if(t.lat > maxLat) maxLat = t.lat
						if(t.lng < minLng) minLng = t.lng
						if(t.lng > maxLng) maxLng = t.lng
					} 
				}
				var bounds = new google.maps.LatLngBounds(
					new google.maps.LatLng(minLat, minLng),
					new google.maps.LatLng(maxLat, maxLng)
				);

				map.fitBounds(bounds);
				t=that.permitsTodayDataSource.at(e.data.id);
				if (app.locationService.viewModel.mapMarkers[e.data.id] === null) {
					var position = new google.maps.LatLng(t.lat, t.lng)
					var m = new google.maps.Marker({
						map: map,
						position: position,
						title: t.address

					});
					app.locationService.viewModel.mapMarkers[e.data.id] = m
				} else {
					app.locationService.viewModel.mapMarkers[e.data.id].setMap(map)
				}
			} else {
				if (app.locationService.viewModel.mapMarkers[e.data.id] !== null)
					app.locationService.viewModel.mapMarkers[e.data.id].setMap(null)
			}
		},

		onNavigateHome: function () {
			var that = this,
				position;

			that._isLoading = true;
			that.showLoading();

			navigator.geolocation.getCurrentPosition(
				function (position) {
					position = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
					map.panTo(position);
					that._putMarker(position);

					that._isLoading = false;
					that.hideLoading();
				},
				function (error) {
					//default map coordinates
					position = new google.maps.LatLng(38,24);
					map.panTo(position);

					that._isLoading = false;
					that.hideLoading();

					navigator.notification.alert("Unable to determine current location. Cannot connect to GPS satellite.",
						function () { }, "Location failed", 'OK');
				},
				{
					timeout: 10000,
					enableHighAccuracy: true
				}
			);
		},

		onSearchAddress: function () {
			var that = this;

			geocoder.geocode(
				{
					'address': that.get("address")
				},
				function (results, status) {
					if (status !== google.maps.GeocoderStatus.OK) {
						navigator.notification.alert("Unable to find address.",
							function () { }, "Search failed", 'OK');

						return;
					}

					map.panTo(results[0].geometry.location);
					that._putMarker(results[0].geometry.location);
				});
		},

		showLoading: function () {
			if (this._isLoading) {
				application.showLoading();
			}
		},

		hideLoading: function () {
			application.hideLoading();
		},

		_putMarker: function (position) {
			var that = this;

			if (that._lastMarker !== null && that._lastMarker !== undefined) {
				that._lastMarker.setMap(null);
			}

			that._lastMarker = new google.maps.Marker({
				map: map,
				position: position
			});
		}
	});

	app.locationService = {
		initLocation: function () {
			var mapOptions;

			if (typeof google === "undefined"){
				return;
			} 

			app.locationService.viewModel.set("isGoogleMapsInitialized", true);

			mapOptions = {
				zoom: 3,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				zoomControl: true,
				zoomControlOptions: {
					position: google.maps.ControlPosition.LEFT_BOTTOM
				},

				scaleControl: true,
				mapTypeControl: false,
				streetViewControl: false
			};

			map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
			geocoder = new google.maps.Geocoder();
			app.locationService.viewModel.onNavigateHome.apply(app.locationService.viewModel, []);
			
			for (var i=0; i< app.locationService.viewModel.permitsTodayDataSource.data().length; i++) 
				app.locationService.viewModel.mapMarkers[i]=null;
		},
		
		show: function () {
			if (!app.locationService.viewModel.get("isGoogleMapsInitialized")) {
				return;
			}

			//show loading mask in case the location is not loaded yet 
			//and the user returns to the same tab
			app.locationService.viewModel.showLoading();

			//resize the map in case the orientation has been changed while showing other tab
			google.maps.event.trigger(map, "resize");
		},

		hide: function () {
			//hide loading mask if user changed the tab as it is only relevant to location tab
			app.locationService.viewModel.hideLoading();
		},

		viewModel: new LocationViewModel()
	};
}
)(window);