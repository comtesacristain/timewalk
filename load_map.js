var toggleFollowState = 'Off';
var map;
var log ="";
var wgs84 = new OpenLayers.Projection("EPSG:4326");
var sphericalMercator = new OpenLayers.Projection("EPSG:900913");
var timewalk_pts;
var currentWatchId;

function toggleFollow(){
	if(toggleFollowState == "On"){ 	// stop follow mode: toggleFollowState = 'Off' 
		navigator.geolocation.clearWatch(currentWatchId);
		toggleFollowState = 'Off';		
		document.getElementById("toggleFollowButton").value="follow me";
	}else{ // change to follow mode: toggleFollowState = 'On' 
		currentWatchId = navigator.geolocation.watchPosition(showMap, handleError);
		toggleFollowState = 'On';    		
		document.getElementById("toggleFollowButton").value="stop following me";
	}	
}

function handler(request) {
	if(request.status != 200){alert(request.getAllResponseHeaders());}
}


function load(){
	var request = OpenLayers.Request.GET({
	    url: location+"/javascripts/Time_Walk_pts.json",
	    callback: handler
		, async: false
	});	         
	timewalk_pts = eval("(" + request.responseText + ")");

	var touch_nav_options = {
	     zoomWheelEnabled: false,
	     dragPanClass: IOL.Control.DragPan,
	     touchZoomClass: IOL.Control.TouchZoom,
	     dragPanOptions: {
	         handlerClass:IOL.Handler.Drag,
	         interval:25
	     }};
	
	var options = { projection: sphericalMercator,
		units: "m",
		displayProjection: wgs84,
		maxResolution: 156543.0339,
		maxExtent: new OpenLayers.Bounds(-20037508.34, -20037508.34,20037508.34, 20037508.34) ,
        controls: [
            new IOL.Control.Navigation(touch_nav_options)
        ]		
	};

	map = new OpenLayers.Map( 'map', options );
	var googleStreets = new OpenLayers.Layer.Google("Google Streets" , {type: G_NORMAL_MAP, numZoomLevels:22, sphericalMercator:true});
	var googleSatellite = new OpenLayers.Layer.Google("Google Satellite" , {type: G_SATELLITE_MAP, numZoomLevels:22, sphericalMercator:true});
	map.addLayers([googleStreets,googleSatellite]);

	var geojson = new OpenLayers.Layer.GML("Timewalk", "javascripts/Time_Walk_pts.json", {
		projection: wgs84,
		format: OpenLayers.Format.GeoJSON});
	map.addLayer(geojson);

	map.addControl(new OpenLayers.Control.LayerSwitcher());
	map.addControl(new OpenLayers.Control.MousePosition());

	//var proj = new OpenLayers.Projection("EPSG:4326");
	var point = new OpenLayers.LonLat(149.15839, -35.34371);
	map.setCenter(point.transform(wgs84, map.getProjectionObject()),15);
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(showMap, handleError);
	}
	else {
		alert("Geolocation not supported (you'll need an iPhone!), so here is Geoscience Australia");
	}
}

function showMap(position) {
	var point = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude)
	var curr_zoom = map.zoom;
	map.setCenter(point.transform(wgs84, sphericalMercator),curr_zoom);
	

	marker= getClosestMarker ( position.coords.longitude, position.coords.latitude );
	getInfo(marker);
	
}

function getClosestMarker ( deviceLongitude, deviceLatitude ) {
	var j = 0;
	var currentDistance = 0;
	var minimumDistance = 0;
	var i;
	for (i=0;i<timewalk_pts.features.length;i++) {
		markerLongitude = timewalk_pts.features[i].geometry.coordinates[0];
		markerLatitude = parseFloat(timewalk_pts.features[i].geometry.coordinates[1]);
		currentDistance = Math.sqrt((markerLongitude-deviceLongitude)*(markerLongitude-deviceLongitude)+(markerLatitude-deviceLatitude)*(markerLatitude-deviceLatitude));
		if (i==0) {
			minimumDistance = currentDistance;
		}
		else {
			if (currentDistance < minimumDistance) {
				minimumDistance = currentDistance;
				j=i;
			}
		}
	}
	return timewalk_pts.features[j].properties.Ma;
}


function getInfo( marker ) {

	for (i=0;i<timewalk.ages.length;i++) {
		if ((marker < timewalk.ages[i].start) && (marker > timewalk.ages[i].end)) {
			document.getElementById("title").innerHTML = timewalk.ages[i].name;
			document.getElementById("info").innerHTML = timewalk.ages[i].info;
		}
	}
}

function handleError(a) {
	var map = document.getElementById("map");
	map.innerHTML = log = log + "<p> error: " + a.code + "</p>";
}
    