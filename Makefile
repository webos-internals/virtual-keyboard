WEBOS_VERSION=1.4.5
DOCTOR_DIR=/source/webos_doctors
ROOT=${DOCTOR_DIR}/root-${WEBOS_VERSION}
PWD=$(shell pwd)
PATCH_FILE=${PWD}/add-onscreen-keyboard.patch

.PHONY: all
all: stock apply

.PHONY: stock
stock: ${ROOT}

.PHONY: apply
apply: stock build/.patch-applied
build/.patch-applied:
	@mkdir -p build
	@patch --no-backup-if-mismatch -p1 -d ${ROOT}/ -i ${PATCH_FILE}
	@cp -a additional_files/* ${ROOT}/
	@touch $@

.PHONY: generate
generate: stock
	@mkdir -p build
	@touch build/.patch-applied
	@rm -f ${PATCH_FILE}
	@rm -rf additional_files
	@rm -f ${ROOT}/files.aupt
	@cd ${ROOT} && git ls-files -mo --exclude-standard > ${ROOT}/files.aupt
	@cd ${ROOT} && git add -u && git diff --cached > ${PATCH_FILE} && git reset
	@cd ${ROOT} && \
		for i in `git ls-files -o --exclude-standard`; do \
			mkdir -p `dirname ${PWD}/additional_files/$$i`; \
			cp $$i ${PWD}/additional_files/$$i; \
		done

${ROOT}: ${DOCTOR_DIR}/webosdoctor-${WEBOS_VERSION}.jar
	@mkdir -p $@
	@if [ -e $< ]; then \
		unzip -p $< resources/webOS.tar | \
		tar -O -x -f - ./nova-cust-image-castle.rootfs.tar.gz | \
		tar -C $@ -m -z -x -f - ./usr; \
	fi
	@rm -f `find $@ -type l`
	@cd $@ && git init && echo "files.aupt\n*.swp\n*.swo" > .gitignore && git add . && git commit -a -m"Initial Commit" && git tag stock && git clean -f -d

clobber:
	@rm -rf build
	@if [ -d ${ROOT} ]; then \
		cd ${ROOT} && git reset --hard && git clean -d -f; \
	fi
