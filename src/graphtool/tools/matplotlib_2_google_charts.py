mpl_2_gc = {
            'GratiaStackedBar':   {
                                    'gc_type':'gc_combo_chart',
                                    'gc_js_setup':
                                        """
                                        gc_obj.chart_properties = {
                                            seriesType: 'bars',
                                            isStacked: true,
                                            bar: { groupWidth: '90%'},
                                            legend: {position: 'none'},
                                            chartArea:{width:'75%',height:'80%'}
                                        };
                                        gc_obj.chart_formatters = {}
                                        """
                                  },
            'GratiaPie':          {
                                    'gc_type':'gc_pie_chart',
                                    'gc_js_setup':
                                        """
                                        gc_obj.chart_properties = {
                                          legend: {position: 'none'},
                                          chartArea:{width:'75%',height:'80%'}
                                        };
                                        gc_obj.chart_formatters = {}
                                        """
                                    },
            'GratiaStackedLine':  {
                                      'gc_type':'gc_combo_chart',
                                      'gc_js_setup':
                                          """
                                          gc_obj.chart_properties = {
                                              seriesType: 'area',
                                              isStacked: true,
                                              bar: { groupWidth: '90%'},
                                              legend: {position: 'none'},
                                              chartArea:{width:'75%',height:'80%'}
                                          };
                                          gc_obj.chart_formatters = {}
                                          """
                                    },
            'GratiaCumulative':    {
                                      'gc_type':'gc_combo_chart',
                                      'gc_js_setup':
                                          """
                                          gc_obj.chart_properties = {
                                              seriesType: 'area',
                                              isStacked: true,
                                              bar: { groupWidth: '90%'},
                                              legend: {position: 'none'},
                                              chartArea:{width:'75%',height:'80%'}
                                          };
                                          gc_obj.chart_formatters = {};
                                          gc_obj.cumulative = true;
                                          """
                                    },
            'QualityMap':           {
                                      'gc_type':'gc_quality_map_chart',
                                      'gc_js_setup':
                                          """
                                          gc_obj.chart_properties = {};
                                          gc_obj.chart_formatters = {};
                                          """
                                    }
            }

