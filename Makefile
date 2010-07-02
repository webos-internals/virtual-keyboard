APP_ID=$(shell cat appinfo.json | grep id | cut -d\" -f4)
VERSION=$(shell cat appinfo.json | grep version | cut -d\" -f4)
WEBOS_VERSION=$(shell git branch | grep ^\* | cut -d- -f2)
DOCTOR_DIR=/source/webos_doctors
ROOT=${DOCTOR_DIR}/root-${WEBOS_VERSION}
PWD=$(shell pwd)
PATCH_FILE=${PWD}/add-onscreen-keyboard.patch
PALM_FILES=$(shell lsdiff --strip=1 --addprefix=additional_files/ ${PATCH_FILE})

.PHONY: all
all: apply

.PHONY: stock
stock: ${ROOT}

.PHONY: apply
apply: stock ${PALM_FILES}
${PALM_FILES}: patch
	@touch .gitignore
	@[ "`grep $@ .gitignore`" != "" ] || echo $@ >> .gitignore
	@cp ${ROOT}/`echo $@ | cut -d/ -f2-` $@
			
.PHONY: patch
patch:
	@cd ${ROOT} && git reset --hard && git clean -d -f
	@patch --no-backup-if-mismatch -p1 -d ${ROOT}/ -i ${PATCH_FILE}

.PHONY: generate
generate: stock
	@cd ${ROOT} && git reset --hard && git clean -d -f
	@cp -r additional_files/usr ${ROOT}/
	@cd ${ROOT} && git add -u && git diff --cached > ${PATCH_FILE} && \
		git reset --hard && git clean -d -f
	#@mkdir -p build
	#@touch build/.patch-applied
	#@rm -f ${PATCH_FILE}
	#@rm -rf additional_files
	#@rm -f ${ROOT}/files.aupt
	#@cd ${ROOT} && git ls-files -mo --exclude-standard > ${ROOT}/files.aupt
	#@cd ${ROOT} && git add -u && git diff --cached > ${PATCH_FILE} && git reset
	#@cd ${ROOT} && \
		#for i in `git ls-files -o --exclude-standard`; do \
			#mkdir -p `dirname ${PWD}/additional_files/$$i`; \
			#cp $$i ${PWD}/additional_files/$$i; \
		#done

.PHONY: install
install:
	@rsync -av additional_files/ root@192.168.0.202:/var/.testing

.PHONY: restart
restart:
	@novacom run file:///sbin/stop LunaSysMgr
	@novacom run file:///sbin/start LunaSysMgr

.PHONY: remove-usb
remove-usb:
	palm-install -d usb -r com.egaudet.vkb-test

.PHONY: install-usb
install-usb: package
	palm-install -d usb ipkgs/com.egaudet.vkb-test_1.0.0_all.ipk

.PHONY: package
package: ipkgs/com.egaudet.vkb-test_1.0.0_all.ipk
	~/webos-internals/build/toolchain/ipkg-utils/ipkg-make-index -v -p ipkgs/Packages ipkgs/
	rsync -av ipkgs/ /source/www/feeds/test

ipkgs/%: build/CONTROL/postinst build/CONTROL/prerm build/CONTROL/control build/usr/palm/applications/com.egaudet.vkb-test
	mkdir -p ipkgs
	~/webos-internals/build/toolchain/ipkg-utils/ipkg-build -o 0 -g 0 -p build
	mv $* $@

build/usr/palm/applications/com.egaudet.vkb-test: build/appinfo.json
	mkdir -p $@
	cp -r additional_files $@
	cp add-onscreen-keyboard.patch $@
	mv $< $@
	echo mojo > $@/package_list

#package: pmPostInstall.script pmPreRemove.script appinfo.json
	#palm-package .

build/CONTROL/control:
	mkdir -p build/CONTROL
	touch $@
	echo "Package: com.egaudet.vkb-test" >> $@
	echo "Version: 1.0.0" >> $@
	echo "Architecture: all" >> $@
	echo "Maintainer: WebOS Internals" >> $@
	echo "Description: VKB - Testing" >> $@
	echo "Section: Mojo" >> $@
	echo "Priority: optional" >> $@
	echo "Source: {\"Type\":\"Patch\", \"Category\":\"Mojo\", \"PostInstallFlags\":\"RestartLuna\"}" >> $@

build/appinfo.json:
	touch $@
	echo "{" > $@
	echo "\"title\":\"VKB\"," >> $@
	echo "\"id\":\"com.egaudet.vkb-test\"," >> $@
	echo "\"version\":\"1.0.0\"," >> $@
	echo "\"vendor\":\"WebOS Internals\"," >> $@
	echo "\"type\":\"web\"," >> $@
	echo "\"main\":\"index.html\"," >> $@
	echo "}" >> $@

build/CONTROL/postinst:
	mkdir -p build/CONTROL
	sed -e 's|PATCH_NAME=|PATCH_NAME=add-onscreen-keyboard.patch|' \
			-e 's|APP_DIR=|APP_DIR=/media/cryptofs/apps/usr/palm/applications/com.egaudet.vkb-test|' ~/webos-internals/build/autopatch/postinst > $@
	chmod a+x $@

build/CONTROL/prerm:
	mkdir -p build/CONTROL
	sed -e 's|PATCH_NAME=|PATCH_NAME=add-onscreen-keyboard.patch|' \
			-e 's|APP_DIR=|APP_DIR=/media/cryptofs/apps/usr/palm/applications/com.egaudet.vkb-test|' ~/webos-internals/build/autopatch/prerm > $@
	chmod a+x $@

${ROOT}: ${DOCTOR_DIR}/webosdoctor-${WEBOS_VERSION}.jar
	@mkdir -p $@
	@if [ -e $< ]; then \
		unzip -p $< resources/webOS.tar | \
		tar --wildcards -O -x -f - './nova-cust-image-*.rootfs.tar.gz' | \
		tar -C $@ -m -z -x -f - ./usr; \
	fi
	@rm -f `find $@ -type l`
	@cd $@ && git init && echo "files.aupt\n*.swp\n*.swo" > .gitignore && git add . && git commit -a -m"Initial Commit" && git tag stock && git clean -f -d

clobber:
	@rm -rf build ipkgs
	@rm -f *.ipk

clobber-root:
	@if [ -d ${ROOT} ]; then \
		cd ${ROOT} && git reset --hard && git clean -d -f; \
	fi
