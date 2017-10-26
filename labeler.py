import sys
import os


def labelFile():
	inputFile = None
	outputFile = None

	if(len(sys.argv) == 1): #no input file
		print("No input file entered.")
		exit(0)
	else: #only input file name. auto creates output name
		inputName = sys.argv[1]
		inputFile = open(inputName,'r')
		if(len(sys.argv) == 2):
			outputName = (inputName.split('.'))[0] + ".disassembled"
		else:
			outputFile = sys.argv[2]

		outputFile = open(outputName,'w')


	codes = get_opcodes()

	for line in inputFile:
		tokens = line.split(" ")
		outputFile.write(tokens[0] + '\n') #writes line number to file
		for token in tokens:
			if(token in codes):
				outputFile.write(token + "\t" + codes[token] + '\n')
		outputFile.write("\n")

	outputFile.close()
	inputFile.close()


			






def get_opcodes():
	opcodeFile = open('opcodes','r')
	codes = {}
	for line in opcodeFile:
		tokens = line.split() 
		code = tokens[0].split('0x')[1]  #for a code like 0xc3, removes 0x and returns ['','c3']. gets c3 from index 1
		tokens = tokens[1:] ##removes first token from list
		codes[code] = "\t".join(tokens)
		


	return codes




labelFile()