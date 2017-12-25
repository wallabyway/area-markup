var viewer;
var markup;
var DBURL = 'http://localhost:3000';


// Vue.js components
window.app = new Vue({
  el: "#app",
  data: {
    styleIcon: {
      backgroundPosition:0,
      borderRadius:"20px"
    },
    name: '',
    item: {
      title:"myTitle",
      description:"myDesc",
      markupId:0,
      type:0,
    },
    itemIsVisible:false,
    Items: [ { title: 'loading...', url:"" }]
  },
  methods: {
    init: function() {
      this.loadData();
      this.initializeViewer();
    },

    initializeViewer: function() {
      viewer = new Autodesk.Viewing.Private.GuiViewer3D(document.getElementById('forgeViewer'), {});
      var options = {
          env: "Local",
          useADP: false,
          urn: "f607ee1f-a7f5-05d4-f46a-438ff1ae52a4_f2d/primaryGraphics.f2d"
      }
      Autodesk.Viewing.Initializer( options, function() {
          viewer.start(options.urn, options, onSuccess);            
      });
      function onSuccess() {
          //viewer.loadExtension('Autodesk.Viewing.MarkupsCore').then(function(markupsExt){
           // markup = markupsExt;
          //});
          //viewer.loadExtension("measure2");
      }
    },

    onPointClick: function (itemIndex) {
    },

    cardClick: function (item) {
      //load measurement
      viewer.dispatchEvent(new CustomEvent('newData', {'detail': JSON.parse(item.json)}));
    },

    loadData: function() {
      fetch(`${DBURL}/allMarkup?approvalid=1`).then(r => r.json()).then( data=> {
          this.Items = data;
      })
    }
  },

  computed: {
    sortedUsers() {
      return this.Items
        .sort((a, b) => { return b.userID - a.userID;});
    },
    sortedRFIs() {
      return this.Items
        .filter((a)=> {return (a.type=="RFI") })
        .sort((a, b) => { return b.markupId - a.markupId;});
    }, 
    sortedHazardWarnings() {
      return this.Items
        .filter((a)=> { return ((a.type=="BIMIQ_Hazard") || (a.type=="BIMIQ_Warning"))})
        .sort((a, b) => { return b.markupId - a.markupId;});
    },
    sheetViews() {
      return [{title:"2D sheet",urn:"wAyDxQGBgsFAgwJChgOCxQJCQwEAwT"},
              {title:"3D sheet",urn:"dfsAyDxQGBgsFAgwJChgOCxQJCQwEAwT"}];
    },
    showAlert() {
     return this.name.length > 4 ? true : false;
    }
  }
})
