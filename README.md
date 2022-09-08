# Find Duplicate Files

A console application 
Finds duplicate files within a folder having different names    
Useful when recovering files from a storage device, where there might be multiple instances of the same file but recovered with differnet names.


### To compile ts files:  
`npm run compile`

### To execute script:  
`npm start -- --dir '<full path to directory to scan>'`  
*Note the extra `--`*

### Options:  
`--dir` - [mandatory] Full path to directory  
`--list` - [optional] Lists all the unique files with their duplicates if any  
`--execute` - [optional] Executes the selected operation on the duplicate files

Currently only 'move' operation works, where a new folder called 'duplicates' is created  
in the given directory and duplicate files are moved there.


### Example to compile and run the script:
`npm run compile-start -- --dir 'C:/Users/jones/Downloads' --list --execute`
