
var app = angular.module('products', []);

app.controller('productCTRL', function ($scope, $http) {
    
    $scope.loader = {
        loading: false
    };
    
    $scope.showCreateForm = function () {
        // clear form
        $scope.clearForm();

        // change modal title
        $('#modal-product-title').text('Create New Student');

        // hide update product button
        $('#btn-update-product').hide();

        // show create product button
        $('#btn-create-product').show();

    };

    // Clear form values
    $scope.clearForm = function () {
        $scope.id = "";
        $scope.name = "";
        $scope.description = "";
        $scope.price = "";
        $scope.modalstatustext = "";
    };
    
    // Hide Form fields 
    $scope.hideFormFields = function () {
        $('#form-dinminder').hide();
    };
    
    // Show Form fields 
    $scope.showFormFields = function () {
        $('#form-dinminder').show();
    };

    //Read all entries
    $scope.getAll = function () {
        
        $scope.loader.loading = true;
        
        $http.get("api/list")
            .success(function (response) {
                if (response.error === 2) {
					//if error code is returned from node code, then there are no entries in db!
					$scope.statustext = "There are currently no products available!";
					$scope.loader.loading = false;
				} else {
					$scope.names = response.products;
					//Turn off spinner
					$scope.loader.loading = false;
					$scope.statustext = "";
				}
            })
            .error(function (data, status, headers, config) {
                $scope.loader.loading = false;
                $scope.statustext = "There was an error fetching data, please check database connection!";
            });
    };

    // Read product by ID
    $scope.readOne = function (id) {
        // clear modal content
        $scope.clearForm();
        $scope.hideFormFields();
        
        // change modal title
        $('#modal-product-title').text("Edit Student");

        // show udpate product button
        $('#btn-update-product').show();

        // show create product button
        $('#btn-create-product').hide();
        
        $scope.loader.loading = true;

        // get id 
        $http.get('api/list/' + id)
            .success(function (data, status, headers, config) {
                //Show fields
                $scope.showFormFields();
                // put the values in form
                $scope.id = data.product[0].id;
                $scope.name = data.product[0].name;
                $scope.description = data.product[0].description;
                $scope.price = data.product[0].price;

                // show modal
                $('#myModal').modal('show');
                //Turn off spinner
                $scope.loader.loading = false;
            })
            .error(function (data, status, headers, config) {
                //Turn of spinner & display error
                $scope.loader.loading = false;
                $scope.modalstatustext = "There was an error fetching data";
            });
    };

    // Create Product
    $scope.createProduct = function () {
        
        $scope.loader.loading = true;
        
        $http.post('/api/insert', {
            'name' : $scope.name,
            'description' : $scope.description,
            'price' : $scope.price
        })
            .success(function (data, status, headers, config) {
                // close modal
                $('#myModal').modal('hide');

                // clear modal content
                $scope.clearForm();

                // refresh the product list
                $scope.getAll();
            })
            .error(function (data, status, headers, config) {
                $scope.loader.loading = false;
                $scope.modalstatustext = "Unable to Update data!";
            });
    };
	
	// update product record / save changes
    $scope.updateProduct = function () {
        
        $scope.loader.loading = true;
        
        $http.put('/api/update', {
            'id' : $scope.id,
            'name' : $scope.name,
            'description' : $scope.description,
            'price' : $scope.price
        })
            .success(function (data, status, headers, config) {
                // close modal
                $('#myModal').modal('hide');

                // clear modal content
                $scope.clearForm();

                // refresh the product list
                $scope.getAll();
            })
            .error(function (data, status, headers, config) {
                $scope.loader.loading = false;
                $scope.modalstatustext = "Unable to Update data!";
            });
    };

    //Delete product
    $scope.deleteProduct = function (id) {
        $scope.loader.loading = true;
		
        $http.post('/api/delete', {
            'id' : id
        })
            .success(function (data, status, headers, config) {
				//The modal id is the #confirm + id ( d.id ) passed into function.
				//The confirm modal is unique to the ID (#confirm+ID) of the product.
                $('#confirm' + id).modal('hide');
                // refresh the list
                $scope.getAll();
            })
            .error(function (data, status, headers, config) {
                $scope.modalstatustext = "Unable to delete data!";
				// refresh the list
                $scope.getAll();
            });
    };

});