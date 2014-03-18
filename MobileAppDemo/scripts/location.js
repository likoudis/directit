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

		addressonMap: [{id:0, isOnMap:false}],
		
		permitsTodayDataSource: null,
		
		inspectionAddressOnMap : function (e) {
			return e.isOnMap;
		},

		init: function () {
		    var that = this,
			//addressOnMap = [],
			dataSource;

			kendo.data.ObservableObject.fn.init.apply(that, []);

			dataSource = new kendo.data.DataSource({
				data: [
					{id: 0, lon:00, lat:00, address: "address1", isOnMap: false},
					{id: 1, lon:10, lat:10, address: "address2", isOnMap: true },
					{id: 2, lon:20, lat:20, address: "address3", isOnMap: false},
					{id: 3, lon:30, lat:30, address: "address4", isOnMap: false},
					{id: 4, lon:40, lat:40, address: "address5", isOnMap: true },
					{id: 5, lon:50, lat:50, address: "address6", isOnMap: true },
					{id: 6, lon:60, lat:60, address: "address7", isOnMap: false}
				],
			});

			this.set("permitsTodayDataSource", dataSource);
			
			//for (var i=0; i<dataSource.data().length; i++)
			//	addressOnMap.push({id: dataSource.at(i).id, isOnMap:false});
			//this.set("inspectionAddressonMap", addressOnMap);
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
                    position = new google.maps.LatLng(0,0);
                    map.panTo(position);

                    that._isLoading = false;
                    that.hideLoading();

                    navigator.notification.alert("Unable to determine current location. Cannot connect to GPS satellite.",
                        function () { }, "Location failed", 'OK');
                },
                {
                    timeout: 30000,
                    enableHighAccuracy: true
                }
            );
        },

		onInspectionSelect: function (e) {
			e.data.isOnMap = !e.data.isOnMap;
			$("#listview-permitsToday").data("kendoMobileListView").refresh();
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
                zoom: 15,
                mapTypeId: google.maps.MapTypeId.ROADMAP,
                zoomControl: true,
                zoomControlOptions: {
                    position: google.maps.ControlPosition.LEFT_BOTTOM
                },

                mapTypeControl: false,
                streetViewControl: false
            };

            map = new google.maps.Map(document.getElementById("map-canvas"), mapOptions);
            geocoder = new google.maps.Geocoder();
            app.locationService.viewModel.onNavigateHome.apply(app.locationService.viewModel, []);
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