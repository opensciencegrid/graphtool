
  function drawChart() {
    var data_gc = google.visualization.arrayToDataTable(data);

    tree = new google.visualization.TreeMap(document.querySelector('#chart_div'));

    tree.draw(data_gc, {
      minColor: '#d00',
      midColor: '#dd0',
      maxColor: '#0d0',
      headerHeight: 15,
      fontColor: 'black',
      showScale: true
    });

  }
  
  google.load("visualization", "1", {packages:["treemap"], callback: drawChart });

